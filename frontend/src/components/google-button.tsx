import { Button } from "@/components/ui/button";

function GoogleButton() {
  return (
    <Button type="button" variant="outline" size="lg">
      <span aria-hidden className="size-5 bg-google" />
      Lanjutkan dengan Google
    </Button>
  );
}

export { GoogleButton };
