"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, "type" | "trailing">;

function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <FormField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          <Icon aria-hidden />
          <span className="sr-only">
            {visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          </span>
        </Button>
      }
    />
  );
}

export { PasswordField };
