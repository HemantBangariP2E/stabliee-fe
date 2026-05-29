/**
 * Stabliee — chat-only Telegram bot (same flows as Tresori Pay).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bot, InlineKeyboard, session } from 'grammy';
import { walletFromVerifyResult } from './authFlow.js';
import { getWallet, saveWallet, clearWallet, isLoggedIn } from './sessions.js';
import {
  checkWalletExists,
  createSmartWallet,
  resolveAuthWalletType,
  defaultStableSymbol,
  fetchBalances,
  getChainLabel,
  normalizePhone,
  computeStablieeSendFees,
  getHardcodedFeeRecipient,
  sendGaslessTransfer,
  sendPhoneOtp,
  verifyPhoneOtp,
} from './walletClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in stabliee-fe/.env');
  process.exit(1);
}

const bot = new Bot(token);
const stableSym = defaultStableSymbol();

bot.use(
  session({
    initial: () => ({
      step: null,
      loginUserId: null,
      loginCountry: null,
      loginPhone: null,
      sendAmount: null,
      sendTo: null,
      sendFees: null,
    }),
  }),
);

function tgId(ctx) {
  return ctx.from?.id;
}

function helpText() {
  return (
    '*Stabliee bot* (chat wallet)\n\n' +
    `/login — Phone OTP\n` +
    `/balance — ${stableSym} balance\n` +
    `/send — Gasless transfer\n` +
    `/wallet — Your address\n` +
    `/logout — Sign out\n` +
    `/help — Commands\n\n` +
    `Network: ${getChainLabel()}`
  );
}

function requireLogin(ctx) {
  if (!isLoggedIn(tgId(ctx))) {
    return 'Not signed in. Use /login first.';
  }
  return null;
}

bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'there';
  const linked = isLoggedIn(tgId(ctx));
  await ctx.reply(
    `Hi ${name} 👋\n\n` +
      '*Stabliee* — send stablecoins with gasless smart wallet.\n' +
      (linked ? '✅ Signed in.\n\n' : 'Use /login to connect your phone wallet.\n\n') +
      helpText(),
    { parse_mode: 'Markdown' },
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(helpText(), { parse_mode: 'Markdown' });
});

bot.command('logout', async (ctx) => {
  clearWallet(tgId(ctx));
  ctx.session.step = null;
  await ctx.reply('Logged out. /login to sign in again.');
});

bot.command('wallet', async (ctx) => {
  const err = requireLogin(ctx);
  if (err) return ctx.reply(err);
  const w = getWallet(tgId(ctx));
  await ctx.reply(
    `*Wallet* (${getChainLabel()})\n\`${w.walletAddress}\`\n+${w.countryCode} ${w.phone}`,
    { parse_mode: 'Markdown' },
  );
});

bot.command('balance', async (ctx) => {
  const err = requireLogin(ctx);
  if (err) return ctx.reply(err);
  const w = getWallet(tgId(ctx));
  try {
    await ctx.reply('Fetching balance…');
    const bal = await fetchBalances(w.walletAddress);
    const line = bal.stable || `0 ${stableSym}`;
    await ctx.reply(`*Balance* (${getChainLabel()})\n${line}`, {
      parse_mode: 'Markdown',
    });
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`);
  }
});

bot.command('login', async (ctx) => {
  ctx.session.step = 'awaiting_phone';
  ctx.session.loginUserId = crypto.randomUUID();
  await ctx.reply(
    'Send your phone number:\n• `8419924876` (India +91)\n• or `91 8419924876`',
    { parse_mode: 'Markdown' },
  );
});

bot.command('send', async (ctx) => {
  const err = requireLogin(ctx);
  if (err) return ctx.reply(err);
  ctx.session.step = 'awaiting_send_amount';
  await ctx.reply(`Enter ${stableSym} amount (e.g. \`25\`):`, {
    parse_mode: 'Markdown',
  });
});

bot.callbackQuery(/^send_confirm_(yes|no)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const w = getWallet(tgId(ctx));
  if (!w) return ctx.reply('Session expired. /login again.');

  if (ctx.match[1] === 'no') {
    ctx.session.step = null;
    return ctx.editMessageText('Transfer cancelled.');
  }

  try {
    await ctx.editMessageText('Sending via relayer…');
    const result = await sendGaslessTransfer({
      fromAddress: w.walletAddress,
      to: ctx.session.sendTo,
      amount: ctx.session.sendAmount,
      userShard: w.userShard,
      userIdentity: w.phone,
      feeBreakdown: ctx.session.sendFees,
    });
    ctx.session.step = null;
    ctx.session.sendFees = null;
    const hash = result.txHash ? `\nTx: \`${result.txHash}\`` : '';
    await ctx.reply(
      `✅ Sent ${result.transferAmount} ${stableSym} to recipient.\n` +
        `Fee ${result.feeAmount} ${stableSym} → platform wallet.${hash}`,
      { parse_mode: 'Markdown' },
    );
  } catch (e) {
    ctx.session.step = null;
    await ctx.reply(`Transfer failed: ${e.message}`);
  }
});

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;

  const step = ctx.session.step;
  const id = tgId(ctx);

  if (step === 'awaiting_phone') {
    const { countryCode, phone } = normalizePhone(text);
    if (phone.length < 8) return ctx.reply('Invalid phone. /login to retry.');

    try {
      const existence = await checkWalletExists(phone);
      const authWalletType = resolveAuthWalletType(existence);
      const otpType =
        existence.isSmartWalletExists || existence.isMPCExists ? 'verify' : 'sign_in';

      await sendPhoneOtp({
        countryCode,
        phone,
        userId: ctx.session.loginUserId,
        type: otpType,
        authWalletType,
      });

      ctx.session.loginCountry = countryCode;
      ctx.session.loginPhone = phone;
      ctx.session.step = 'awaiting_otp';
      await ctx.reply(`OTP sent to +${countryCode} ${phone}. Reply with the code.`);
    } catch (e) {
      await ctx.reply(`Could not send OTP: ${e.message}`);
    }
    return;
  }

  if (step === 'awaiting_otp') {
    const otp = text.replace(/\D/g, '');
    if (otp.length < 4) return ctx.reply('Send the SMS OTP code.');

    try {
      const existence = await checkWalletExists(ctx.session.loginPhone);
      const authWalletType = resolveAuthWalletType(existence);
      const otpType =
        existence.isSmartWalletExists || existence.isMPCExists ? 'verify' : 'sign_in';

      const verified = await verifyPhoneOtp({
        countryCode: ctx.session.loginCountry,
        phone: ctx.session.loginPhone,
        otp,
        userId: ctx.session.loginUserId,
        type: otpType,
        authWalletType,
      });

      let address;
      let userShard = verified.userShard;
      const existing = walletFromVerifyResult(verified);

      if (existing) {
        address = existing.address;
        userShard = existing.userShard || userShard;
      } else {
        const created = await createSmartWallet(ctx.session.loginUserId, authWalletType);
        address = created.address;
        userShard = created.userShard || userShard;
      }

      if (!userShard) {
        return ctx.reply('No signing key. /login again (existing wallets need verify OTP).');
      }

      saveWallet(id, {
        userId: ctx.session.loginUserId,
        countryCode: ctx.session.loginCountry,
        phone: ctx.session.loginPhone,
        walletAddress: address,
        userShard,
      });
      ctx.session.step = null;
      await ctx.reply(
        `✅ Signed in!\n\`${address}\`\n\n/balance · /send`,
        { parse_mode: 'Markdown' },
      );
    } catch (e) {
      await ctx.reply(`Login failed: ${e.message}`);
    }
    return;
  }

  if (step === 'awaiting_send_amount') {
    const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      return ctx.reply('Invalid amount. /send to retry.');
    }
    ctx.session.sendAmount = amount;
    ctx.session.step = 'awaiting_send_to';
    await ctx.reply(
      `Amount: ${amount} ${stableSym}\n\nSend *recipient* 0x address (not the fee wallet):`,
      { parse_mode: 'Markdown' },
    );
    return;
  }

  if (step === 'awaiting_send_to') {
    const to = text.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return ctx.reply('Invalid address. Send valid 0x…');
    }
    const w = getWallet(id);
    if (!w) return ctx.reply('Session expired. /login again.');

    try {
      const fees = await computeStablieeSendFees(
        w.walletAddress,
        to,
        ctx.session.sendAmount,
      );
      ctx.session.sendTo = to;
      ctx.session.sendFees = fees;
      ctx.session.step = 'awaiting_send_confirm';

      const feeWallet = getHardcodedFeeRecipient();
      const kb = new InlineKeyboard()
        .text('✅ Confirm', 'send_confirm_yes')
        .text('❌ Cancel', 'send_confirm_no');
      await ctx.reply(
        `*Confirm Stabliee send*\n\n` +
          `Recipient gets: *${ctx.session.sendAmount} ${stableSym}*\n` +
          `\`${to}\`\n\n` +
          `Platform fee wallet gets: *${fees.feeAmount} ${stableSym}*\n` +
          `(gas ${fees.gasFeeUsdt} + 1% ${fees.platformFee})\n` +
          `\`${feeWallet}\`\n\n` +
          `Total from your wallet: ~${fees.totalDebited} ${stableSym}`,
        { parse_mode: 'Markdown', reply_markup: kb },
      );
    } catch (e) {
      await ctx.reply(`Could not estimate fees: ${e.message}`);
    }
    return;
  }

  await ctx.reply('Use /help for commands.');
});

bot.catch((err) => console.error('Bot error:', err));

console.log(`Stabliee Telegram bot — ${getChainLabel()}`);
await bot.start({
  onStart: (info) => console.log(`@${info.username} ready`),
});
