import { useUser, useUpdateProfile } from "@/hooks/use-auth"; // هنحتاج نعمل الـ Hook ده
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatarUrl || "");

  // دالة لتحويل الصورة لـ Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // هنا هننادي الـ API اللي عملناه في routes.ts
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatarUrl: avatar }),
    });

    if (res.ok) {
      toast({ title: "تم التحديث", description: "تم حفظ بياناتك بنجاح" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>إعدادات الملف الشخصي</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={avatar} />
                <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">اضغط على الكاميرا لتغيير الصورة</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">اسم العرض (الاسم اللي يظهر للناس)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: Dark" />
          </div>

          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="w-4 h-4" /> حفظ التعديلات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
