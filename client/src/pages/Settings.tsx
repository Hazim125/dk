import { useUser, useUpdateProfile } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Shield, Trash2, Save, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: user, isLoading: userLoading } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // تعبئة البيانات فقط عندما تكتمل عملية التحميل بنجاح
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === 'admin', // لا تجلب المستخدمين إلا لو كان الأدمن موجود
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "تم حذف الموظف بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف الموظف", variant: "destructive" });
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ title: "الصورة كبيرة جداً", description: "يرجى اختيار صورة أقل من 1 ميجا", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 1. حالة التحميل: تمنع ظهور بياض أثناء جلب البيانات
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. حالة عدم وجود مستخدم: حماية من الـ Crash
  if (!user) {
    return (
      <div className="p-8 text-center text-muted-foreground" dir="rtl">
        لم يتم العثور على بيانات المستخدم. جرب تسجيل الخروج والدخول ثانيةً.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8" dir="rtl">
      <h1 className="text-2xl md:text-3xl font-bold">إعدادات الحساب</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> تعديل الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الصورة الشخصية</label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{name?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input type="file" accept="image/*" className="hidden" id="avatar-input" onChange={handleImageUpload} />
                  <label htmlFor="avatar-input">
                    <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                      <span><Upload className="ml-2 h-4 w-4" /> رفع صورة</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">النبذة التعريفية</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة قصيرة عنك..." />
            </div>

            <Button 
              className="w-full" 
              onClick={() => updateProfileMutation.mutate({ name, bio, avatarUrl })}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 flex flex-col items-center justify-center p-6 border-dashed">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl mb-4">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-3xl">{name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{name || "مستخدم جديد"}</h2>
          <Badge variant="outline" className="mt-2 bg-background">
            {user.role === 'admin' ? '🛡️ مدير نظام' : '👤 موظف'}
          </Badge>
          <p className="text-sm text-muted-foreground mt-4 text-center px-4">
            {bio || "لا توجد نبذة تعريفية مضافة حالياً"}
          </p>
        </Card>
      </div>

      {user.role === 'admin' && (
        <Card className="border-red-100">
          <CardHeader className="bg-red-50/50">
            <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" /> التحكم في الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y px-6">
              {usersLoading ? (
                <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              ) : (
                users?.filter(u => u.id !== user.id).map((emp) => (
                  <div key={emp.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={emp.avatarUrl} />
                        <AvatarFallback>{emp.name?.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">@{emp.username}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => confirm(`حذف الموظف ${emp.name}؟`) && deleteMutation.mutate(emp.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
