import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Pencil, Trash2, Copy, Send, ChevronRight, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock list of registered emails (simulating backend check)
const registeredEmails = [
  "tahirjamaluddin@gmail.com",
  "farooqui.nils@gmail.com",
  "vikas.i@gmail.com",
  "tahir.jamal@enordwallet.com",
];

interface Beneficiary {
  id: number;
  name: string;
  nickname?: string;
  email?: string;
  address?: string;
  status: "active" | "pending";
  type: "business" | "user";
}

const initialBeneficiaries: Beneficiary[] = [
  { id: 1, name: "TTT", email: "tahirjamaluddin@gmail.com", address: "0x7e5881f281a7c47f7064f4607d61a8b2c", status: "active", type: "user" },
  { id: 2, name: "Tah", email: "farooqui.nils@gmail.com", address: "0xfd5ea76dfb8ec7d8ff2ace3d4e4d9f1a", status: "active", type: "user" },
  { id: 3, name: "Vikas", email: "vikas.i@gmail.com", address: "0x8b161adb1a9cba42a227fd587e4b3c7e", status: "active", type: "business" },
  { id: 4, name: "Tahir", email: "tahir.jamal@nets.com", address: "0xb42f2146dce442c9c08fcbefca94d2f5", status: "active", type: "user" },
  { id: 5, name: "Alex Wallet", address: "0x3a9f8c2d1e5b7a4c6d8e0f1a2b3c4d5e", status: "active", type: "user" },
  { id: 6, name: "Sarah Pending", email: "sarah.new@example.com", address: "0x9d4e7f2a1b8c5d3e6f0a2b4c", status: "pending", type: "user" },
];

const Beneficiary = () => {
  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  
  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [pendingContactData, setPendingContactData] = useState<Beneficiary | null>(null);
  const [selectedContact, setSelectedContact] = useState<Beneficiary | null>(null);
  const [showContactCard, setShowContactCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editCardName, setEditCardName] = useState("");
  const [editCardNickname, setEditCardNickname] = useState("");

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormEmail("");
    setEditingBeneficiary(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setFormEmail(beneficiary.email || "");
    setShowAddDialog(true);
  };

  const handleSave = () => {
    if (!formEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in email address",
        variant: "destructive",
      });
      return;
    }

    if (editingBeneficiary) {
      setBeneficiaries(beneficiaries.map(b => 
        b.id === editingBeneficiary.id 
          ? { ...b, email: formEmail }
          : b
      ));
      toast({
        title: "Success",
        description: "Beneficiary updated successfully",
      });
      setShowAddDialog(false);
      resetForm();
    } else {
      // Use email as the name/display
      const displayName = formEmail.split('@')[0];
      const newBeneficiary: Beneficiary = {
        id: Date.now(),
        name: displayName,
        email: formEmail,
        status: "active",
        type: "user",
      };

      setBeneficiaries([...beneficiaries, newBeneficiary]);
      toast({
        title: "Success",
        description: "Beneficiary added successfully",
      });
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleSendInvite = () => {
    if (pendingContactData) {
      setBeneficiaries([...beneficiaries, pendingContactData]);
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${pendingContactData.email} to join Stabilee`,
      });
    }
    setShowInviteDialog(false);
    setPendingContactData(null);
    resetForm();
  };

  const handleSkipInvite = () => {
    if (pendingContactData) {
      setBeneficiaries([...beneficiaries, pendingContactData]);
      toast({
        title: "Success",
        description: "Contact added without invitation",
      });
    }
    setShowInviteDialog(false);
    setPendingContactData(null);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setBeneficiaries(beneficiaries.filter(b => b.id !== id));
    toast({
      title: "Deleted",
      description: "Beneficiary removed successfully",
    });
  };

  const copyAddress = (address: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const openContactCard = (beneficiary: Beneficiary) => {
    setSelectedContact(beneficiary);
    setShowContactCard(true);
    setShowDeleteConfirm(false);
    setIsEditingCard(false);
  };

  const handleEditFromCard = () => {
    if (selectedContact) {
      setEditCardName(selectedContact.name);
      setEditCardNickname(selectedContact.nickname || "");
      setIsEditingCard(true);
    }
  };

  const handleSaveCardEdit = () => {
    if (selectedContact && editCardName) {
      setBeneficiaries(beneficiaries.map(b => 
        b.id === selectedContact.id 
          ? { ...b, name: editCardName, nickname: editCardNickname }
          : b
      ));
      setSelectedContact({ ...selectedContact, name: editCardName, nickname: editCardNickname });
      setIsEditingCard(false);
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    }
  };

  const handleCancelCardEdit = () => {
    setIsEditingCard(false);
  };

  const handleDeleteFromCard = () => {
    if (selectedContact) {
      handleDelete(selectedContact.id);
      setShowContactCard(false);
    }
  };

  const handleSendFromCard = () => {
    if (selectedContact) {
      setShowContactCard(false);
      navigate(`/transactions?email=${encodeURIComponent(selectedContact.email || '')}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Contacts</h1>
          <span className="text-xs md:text-sm text-muted-foreground">{beneficiaries.length} contacts</span>
        </div>

        <Card className="p-4 md:p-6 rounded-2xl">
          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name & Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-72 h-10 rounded-xl"
              />
            </div>

            <Button onClick={openAddDialog} variant="outline" className="h-10 rounded-xl w-full sm:w-auto">
              Add New Contact
            </Button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Wallet Address</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((beneficiary) => (
                  <tr 
                    key={beneficiary.id} 
                    className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => openContactCard(beneficiary)}
                  >
                    <td className="py-3 px-4 text-sm font-medium">{beneficiary.name}</td>
                    <td className="py-3 px-4 text-sm">{beneficiary.email || "-"}</td>
                    <td className="py-3 px-4 text-sm">
                      {beneficiary.address ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono">
                          {beneficiary.address.slice(0, 6)}...{beneficiary.address.slice(-4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        beneficiary.type === "business" 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}>
                        {beneficiary.type === "business" ? "Business" : "User"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        beneficiary.status === "active" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {beneficiary.status === "active" ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-border border border-border rounded-xl overflow-hidden">
            {filteredBeneficiaries.map((beneficiary) => (
              <div 
                key={beneficiary.id} 
                className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer active:bg-muted/30"
                onClick={() => openContactCard(beneficiary)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {beneficiary.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-sm">{beneficiary.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>

        {/* Developer Notes */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs font-bold text-yellow-600 mb-3">🛠 Only for NW Developer</p>
          <div className="space-y-2 text-xs text-yellow-700 dark:text-yellow-400">
            <p>1. For add contact, if Email does not exist, show message please invite user to Stabilee. In v2 this should result into an invite</p>
            <p>2. For add contact, if Email address exists - with 0 context mappings, after invite popup confirmation, just add context (temporary pilot). In future - this should result into an invite</p>
            <p>3. For add contact, if Email address exists - with a context mappings, after invite popup confirmation, just update context (temporary pilot). In future - this should result into an invite</p>
          </div>
        </div>
        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden [&>button]:hidden">
            {/* Header with avatar */}
            <div className="bg-gradient-to-b from-primary/10 to-background pt-8 pb-6 px-6 text-center relative">
              <button 
                onClick={() => setShowAddDialog(false)}
                className="absolute top-3 right-3 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-3xl">
                  {formEmail ? formEmail.charAt(0).toUpperCase() : "?"}
                </span>
              </div>
              <h2 className="text-xl font-bold">New Contact</h2>

              {/* Form fields */}
              <div className="space-y-3 text-left mt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address<span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="h-10 rounded-xl"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                className="flex-1 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1 h-11 rounded-xl"
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite Dialog */}
        <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Email Not Registered</AlertDialogTitle>
              <AlertDialogDescription>
                The email address <span className="font-medium text-foreground">{pendingContactData?.email}</span> is not registered in Stabilee. Would you like to send them an invitation to join?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleSkipInvite} className="rounded-xl">
                Add Without Invite
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleSendInvite} className="rounded-xl">
                Send Invite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Contact Card Dialog */}
        <Dialog open={showContactCard} onOpenChange={(open) => {
          setShowContactCard(open);
          if (!open) {
            setShowDeleteConfirm(false);
            setIsEditingCard(false);
          }
        }}>
          <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden [&>button]:hidden">
            {selectedContact && (
              <>
                {/* Header with avatar and name */}
                <div className="bg-gradient-to-b from-primary/10 to-background pt-8 pb-6 px-6 text-center relative">
                  <button 
                    onClick={() => setShowContactCard(false)}
                    className="absolute top-3 right-3 p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                  
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold text-3xl">
                      {(isEditingCard ? editCardName : selectedContact.name).charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Edit mode - only nickname editable */}
                  {isEditingCard ? (
                    <div className="space-y-3 text-left">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nickname</Label>
                        <Input
                          value={editCardNickname}
                          onChange={(e) => setEditCardNickname(e.target.value)}
                          className="h-10 rounded-xl text-center"
                          placeholder="Nickname"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                      {selectedContact.nickname && (
                        <p className="text-sm text-muted-foreground mt-1">"{selectedContact.nickname}"</p>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-center gap-4 mt-5">
                        <button 
                          onClick={handleSendFromCard}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <Send className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <span className="text-xs font-medium">Send</span>
                        </button>
                        <button 
                          onClick={handleEditFromCard}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-foreground" />
                          </div>
                          <span className="text-xs font-medium">Edit</span>
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-foreground" />
                          </div>
                          <span className="text-xs font-medium">Delete</span>
                        </button>
                      </div>

                      {/* Delete confirmation */}
                      {showDeleteConfirm && (
                        <div className="mt-4 p-3 bg-destructive/10 rounded-xl animate-fade-in">
                          <p className="text-sm text-destructive mb-3">Delete this contact?</p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 rounded-lg"
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={handleDeleteFromCard}
                              className="flex-1 rounded-lg"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Contact details */}
                <div className="px-4 pb-4">
                  <div className="bg-muted/30 rounded-xl divide-y divide-border overflow-hidden">
                    {/* Name - always shown, non-editable */}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm font-medium">{selectedContact.name}</p>
                    </div>

                    {selectedContact.email && (
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-medium">{selectedContact.email}</p>
                      </div>
                    )}
                    
                    {selectedContact.address && (
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                        <p className="text-sm font-mono">
                          {selectedContact.address.slice(0, 6)}...{selectedContact.address.slice(-4)}
                        </p>
                      </div>
                    )}
                    
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Type</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedContact.type === "business" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        }`}>
                          {selectedContact.type === "business" ? "Business" : "User"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedContact.status === "active" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {selectedContact.status === "active" ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom button */}
                  {isEditingCard ? (
                    <div className="flex gap-3 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelCardEdit}
                        className="flex-1 h-11 rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveCardEdit}
                        className="flex-1 h-11 rounded-xl"
                        disabled={!editCardName}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowContactCard(false)}
                      className="w-full mt-4 p-3 text-muted-foreground text-sm font-medium hover:bg-primary/10 hover:text-primary rounded-xl transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Beneficiary;