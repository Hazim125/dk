import { useUser } from "@/hooks/use-auth"; 
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // ده السطر اللي كان ناقص

export default function Settings() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatarUrl || "");
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl: avatar }),
      });
      if (res.ok) {
        toast({ title: "تم التحديث ✅", description: "تم حفظ بياناتك بنجاح" });
      } else { throw new Error(); }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحديث البيانات", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader><CardTitle>إعدادات الملف الشخصي</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={avatar} />
                <AvatarFallback>{name?.slice(0, 2) || "U"}</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer hover:scale-110">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم العرض</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: Dark" />
          </div>
          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="w-4 h-4" /> حفظ التعديلات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
