import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <Logo size="md" />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-zinc dark:prose-invert">
          <p className="text-muted-foreground">
            Terms and conditions content will be added here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
