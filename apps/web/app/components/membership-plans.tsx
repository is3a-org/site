import { Button } from "@is3a/design-system/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@is3a/design-system/card";
import { Check, Users, MessageCircle, Calendar, Info } from "lucide-react";
import type { JSX } from "react";

import { MEMBERSHIPS } from "~/lib/memberships";
import { stripeFragmentClient } from "~/lib/stripe-client";

export function MembershipPlans(): JSX.Element {
  const {
    mutate: upgradeSubscription,
    loading,
    error,
  } = stripeFragmentClient.upgradeSubscription();

  const handleSubscribe = async (priceId: string): Promise<void> => {
    const response = await upgradeSubscription({
      body: {
        priceId,
        quantity: 1,
        successUrl: `${window.location.origin}/dashboard/subscribe-confirm`,
        cancelUrl: `${window.location.origin}/dashboard/membership`,
      },
    });
    if (!response) {
      console.error("Subscription error:", response);
      return;
    }
    if (response.url) {
      window.location.href = response.url;
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      <div className="grid gap-8 lg:max-w-5xl lg:grid-cols-2">
        {/* Full Membership */}
        <Card className="relative flex flex-col border-2">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Full Membership</CardTitle>
            <CardDescription className="text-base">
              Access to all events and community
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">€50</span>
                <span className="text-sm text-muted-foreground">per year</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Graduated this year? Use code <span className="font-semibold">GRADUATE24</span> for
                €25
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">4 Event Credits</p>
                  <p className="text-sm text-muted-foreground">
                    Access to all events throughout the year
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Quarterly Events</p>
                  <p className="text-sm text-muted-foreground">
                    At least one networking event every 3 months
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">WhatsApp Community</p>
                  <p className="text-sm text-muted-foreground">Connect with members year-round</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Network & Grow</p>
                  <p className="text-sm text-muted-foreground">
                    Build lasting professional connections
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubscribe(MEMBERSHIPS.FULL.priceId)}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Processing..." : "Get Full Membership"}
            </Button>
          </CardFooter>
        </Card>

        {/* Flex Membership */}
        <Card className="flex flex-col">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Flex Membership</CardTitle>
            <CardDescription className="text-base">
              Pay as you go with event tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">€25</span>
                <span className="text-sm text-muted-foreground">per year</span>
              </div>
              <p className="text-sm text-muted-foreground">Plus €10 per additional event ticket</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">1 Event Credit</p>
                  <p className="text-sm text-muted-foreground">
                    Includes one event, additional tickets €10 each
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Flex Attendance</p>
                  <p className="text-sm text-muted-foreground">
                    Choose which events you want to attend
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">WhatsApp Community</p>
                  <p className="text-sm text-muted-foreground">Connect with members year-round</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Network & Grow</p>
                  <p className="text-sm text-muted-foreground">
                    Build lasting professional connections
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubscribe(MEMBERSHIPS.FLEX.priceId)}
              disabled={loading}
              className="w-full"
              variant="outline"
              size="lg"
            >
              {loading ? "Processing..." : "Get Flex Membership"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Important Notes Section */}
      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            <CardTitle className="text-xl">Important Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Event Credits</h4>
            <p className="text-sm text-muted-foreground">
              Event coupons that are included in your membership are used upon registration to an
              event. Credits expire after one year.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Legal Requirements</h4>
            <p className="text-sm text-muted-foreground">
              As we are an association, Dutch law requires us to:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
              <li>Know the address of our members</li>
              <li>Not make a (personal) financial profit</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Try Before You Buy</h4>
            <p className="text-sm text-muted-foreground">
              Feel free to join one of our events once prior to your membership registration to see
              if we are the right fit for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
