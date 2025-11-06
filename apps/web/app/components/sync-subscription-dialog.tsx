"use client";

import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type User = {
  id: string;
  email: string;
  stripeCustomerId: string | null;
};

type StripeCustomer = {
  id: string;
  email: string | null;
  name?: string | null;
  created: number;
};

type SyncSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: StripeCustomer;
  allUsers: User[];
};

type Step = "select-user" | "create-user" | "confirm";

export function SyncSubscriptionDialog({
  open,
  onOpenChange,
  customer,
  allUsers,
}: SyncSubscriptionDialogProps) {
  const [step, setStep] = useState<Step>("select-user");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [createNew, setCreateNew] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState(customer.email || "");
  const [newUserName, setNewUserName] = useState(customer.name || "");
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchType, setMatchType] = useState<"stripeCustomerId" | "email" | null>(null);

  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("select-user");
      setSelectedUserId("");
      setCreateNew(false);
      setNewUserEmail(customer.email || "");
      setNewUserName(customer.name || "");
      setMatchedUser(null);
      setMatchType(null);

      // Check for existing user match
      const userByStripeId = allUsers.find((u) => u.stripeCustomerId === customer.id);
      if (userByStripeId) {
        setMatchedUser(userByStripeId);
        setMatchType("stripeCustomerId");
        setSelectedUserId(userByStripeId.id);
      } else {
        const userByEmail = allUsers.find((u) => u.email === customer.email);
        if (userByEmail) {
          setMatchedUser(userByEmail);
          setMatchType("email");
          setSelectedUserId(userByEmail.id);
        }
      }
    }
  }, [open, customer, allUsers]);

  // Close dialog on successful submission
  useEffect(() => {
    if (fetcher.data?.success && !isSubmitting) {
      onOpenChange(false);
    }
  }, [fetcher.data, isSubmitting, onOpenChange]);

  const handleNext = () => {
    if (step === "select-user") {
      if (createNew) {
        setStep("create-user");
      } else if (selectedUserId) {
        handleSubmit();
      }
    } else if (step === "create-user") {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("intent", "sync-subscription");
    formData.append("stripeCustomerId", customer.id);
    formData.append("stripeCustomerEmail", customer.email || "");

    if (createNew) {
      formData.append("createNewUser", "true");
      formData.append("newUserEmail", newUserEmail);
      formData.append("newUserName", newUserName);
    } else {
      formData.append("userId", selectedUserId);
    }

    fetcher.submit(formData, { method: "post" });
  };

  const canProceed = () => {
    if (step === "select-user") {
      return createNew || selectedUserId;
    }
    if (step === "create-user") {
      return newUserEmail.trim() !== "" && newUserEmail.includes("@");
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sync Stripe Subscription</DialogTitle>
          <DialogDescription>
            Link this Stripe customer to a user and sync their subscription data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer Info */}
          <div className="space-y-1 rounded-md border p-3">
            <p className="text-sm font-medium">Stripe Customer</p>
            <p className="text-muted-foreground text-sm">
              {customer.name || customer.email || customer.id}
            </p>
            {customer.email && <p className="text-muted-foreground text-xs">{customer.email}</p>}
          </div>

          {/* Error Display */}
          {fetcher.data?.error && (
            <div className="border-destructive/50 bg-destructive/10 flex items-start gap-2 rounded-md border p-3">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-destructive text-sm">{fetcher.data.error}</div>
            </div>
          )}

          {/* Match Info */}
          {matchedUser && matchType && (
            <div className="flex items-start gap-2 rounded-md border border-green-500/50 bg-green-500/10 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  User found by {matchType === "stripeCustomerId" ? "Stripe ID" : "email"}
                </p>
                <p className="text-green-800 dark:text-green-200">{matchedUser.email}</p>
              </div>
            </div>
          )}

          {/* Step 1: Select User */}
          {step === "select-user" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Select User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={(value) => {
                    if (value === "__create_new__") {
                      setCreateNew(true);
                      setSelectedUserId("");
                    } else {
                      setCreateNew(false);
                      setSelectedUserId(value);
                    }
                  }}
                  disabled={createNew}
                >
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__create_new__">Create New User</SelectItem>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                        {user.stripeCustomerId && " (already linked to Stripe Customer)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-new"
                  checked={createNew}
                  onChange={(e) => {
                    setCreateNew(e.target.checked);
                    if (e.target.checked) {
                      setSelectedUserId("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="create-new" className="cursor-pointer font-normal">
                  Create a new user instead
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Create User */}
          {step === "create-user" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Name</Label>
                <Input
                  id="new-user-name"
                  type="text"
                  placeholder="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  A password will be auto-generated for this user.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {step === "create-user" && (
            <Button
              variant="outline"
              onClick={() => setStep("select-user")}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canProceed() || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {step === "create-user" || !createNew ? "Sync Subscription" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
