import { useUser, useUpdateProfile } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  // دالة تحويل الصورة لـ Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // منع الصور أكبر من 1 ميجا
        toast({ title: "الصورة كبيرة جداً", description: "يرجى اختيار صورة أقل من 1 ميجا", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "تم حذف الموظف بنجاح" });
    },
  });

  if (userLoading || usersLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8" dir="rtl">
      <h1 className="text-3xl font-bold">إعدادات النظام</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> تعديل البروفايل</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* زرار رفع الصورة */}
            <div className="space-y-2">
              <label className="text-sm font-medium">صورة البروفايل</label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{name?.slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                   <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="avatar-upload" 
                    onChange={handleImageUpload} 
                   />
                   <label htmlFor="avatar-upload">
                     <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                       <span><Upload className="ml-2 h-4 w-4" /> اختر صورة</span>
                     </Button>
                   </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">النبذة (Bio)</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <Button 
              className="w-full" 
              onClick={() => updateProfileMutation.mutate({ name, bio, avatarUrl })}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              حفظ الإعدادات
            </Button>
          </CardContent>
        </Card>

        {/* عرض الرتبة وحالة الحساب */}
        <Card className="bg-primary/5">
          <CardHeader className="text-center">
             <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">{name?.slice(0,2)}</AvatarFallback>
             </Avatar>
             <CardTitle className="text-xl">{name}</CardTitle>
             <Badge className="mt-2 mx-auto">{user?.role === 'admin' ? '🛡️ مدير نظام' : '👤 موظف'}</Badge>
          </CardHeader>
        </Card>
      </div>

      {/* إدارة الموظفين */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><Shield className="h-5 w-5" /> إدارة الموظفين</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {users?.filter(u => u.id !== user.id).map((employee) => (
              <div key={employee.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarImage src={employee.avatarUrl} /><AvatarFallback>{employee.name?.slice(0,2)}</AvatarFallback></Avatar>
                  <div><p className="font-medium text-sm">{employee.name}</p><p className="text-xs text-muted-foreground">@{employee.username}</p></div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => confirm(`حذف ${employee.name}؟`) && deleteMutation.mutate(employee.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
