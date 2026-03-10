import { Button } from '@/components/ui/button';

/**
 * Button variant showcase — saved from original welcome.tsx.
 * Route this at e.g. /en/button-showcase for dev reference.
 */
export default function ButtonShowcase() {
    return (
        <div className="min-h-screen bg-background p-10">
            <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 shadow-sm">
                <h1 className="mb-1 font-medium text-foreground">Button variants</h1>
                <p className="mb-6 text-sm text-muted-foreground">All available button styles for this application.</p>

                <div className="mb-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary actions</p>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="enroll">Enroll Now</Button>
                        <Button variant="hero">Get Started</Button>
                        <Button variant="premium">Go Pro</Button>
                        <Button variant="complete">Submit Quiz</Button>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Secondary actions</p>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="progress">Continue</Button>
                        <Button variant="secondary">Learn More</Button>
                        <Button variant="ghost">Cancel</Button>
                        <Button variant="link">View Details</Button>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special states</p>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="achievement">Claim Badge</Button>
                        <Button variant="danger">Delete Account</Button>
                        <Button variant="utility" size="compact">Edit Row</Button>
                    </div>
                </div>

                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sizes</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="enroll" size="hero">Hero CTA</Button>
                        <Button variant="enroll" size="lg">Large</Button>
                        <Button variant="enroll" size="default">Default</Button>
                        <Button variant="enroll" size="compact">Compact</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
