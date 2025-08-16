"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncShopifyOrders } from "@/lib/actions/shopify";
import { Loader2, RefreshCw } from "lucide-react";

export function SyncShopifyButton() {
    const [isSyncing, startSyncTransition] = useTransition();
    const { toast } = useToast();

    const handleSync = () => {
        startSyncTransition(async () => {
            const result = await syncShopifyOrders();
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
            }
        });
    };

    return (
        <Button onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Sync with Shopify
        </Button>
    );
}
