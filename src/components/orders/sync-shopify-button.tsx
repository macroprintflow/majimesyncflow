"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncShopifyOrders, clearAllOrders } from "@/lib/actions/shopify";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

export function SyncShopifyButton() {
    const [isSyncing, startSyncTransition] = useTransition();
    const [isClearing, startClearTransition] = useTransition();
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

    const handleClear = () => {
        startClearTransition(async () => {
            const result = await clearAllOrders();
            if (result.success) {
                toast({ title: "Success", description: "All orders have been cleared." });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
            }
        });
    }

    return (
        <div className="flex gap-2">
            <Button onClick={handleClear} variant="outline" disabled={isClearing || isSyncing}>
                {isClearing ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Clear All Orders
            </Button>
            <Button onClick={handleSync} disabled={isSyncing || isClearing}>
                {isSyncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Sync Orders
            </Button>
        </div>
    );
}
