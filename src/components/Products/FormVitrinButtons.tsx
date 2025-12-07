import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { DresserIcon } from "@phosphor-icons/react/dist/ssr";

export const FormVitrinButtons = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <DresserIcon weight="duotone" /> دکمه ها
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">a</CardContent>
    </Card>
  );
};
