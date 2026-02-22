import { useUser, useUpdateProfile } from "@/hooks/use-auth"; // تم تصحيح i صغيرة
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Shield, Trash2, Save, Image as ImageIcon } from "lucide-react";
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

  // تحديث القيم المحلية عند تحميل بيانات المستخدم
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8" dir="rtl">
      <h1 className="text-3xl font-bold">إعدادات النظام والملف الشخصي</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> تعديل بياناتي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">رابط صورة البروفايل</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://example.com/image.jpg" 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">النبذة التعريفية (Bio)</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <Button 
              className="w-full" 
              onClick={() => updateProfileMutation.mutate({ name, bio, avatarUrl })}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              حفظ كل التغييرات
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center">
             <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-white shadow-lg">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback className="text-3xl">{name?.slice(0,2)}</AvatarFallback>
             </Avatar>
             <CardTitle className="text-2xl">{name}</CardTitle>
             <p className="text-primary font-bold mt-2">
               {user?.role === 'admin' ? '🛡️ مدير نظام (Dark)' : '👤 موظف'}
             </p>
          </CardHeader>
        </Card>
      </div>

      {user?.role === 'admin' && (
        <Card className="border-red-100 shadow-sm">
          <CardHeader className="bg-red-50/50">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Shield className="h-5 w-5" /> إدارة شؤون الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y px-6">
              {users?.filter(u => u.id !== user.id).map((employee) => (
                <div key={employee.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={employee.avatarUrl} />
                      <AvatarFallback>{employee.name?.slice(0,2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">@{employee.username}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    size="icon"
                    onClick={() => {
                      if(confirm(`هل أنت متأكد من حذف الموظف (${employee.name}) نهائياً؟`)) {
                        deleteMutation.mutate(employee.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
              {users?.filter(u => u.id !== user.id).length === 0 && (
                <p className="p-8 text-center text-muted-foreground italic">لا يوجد موظفون آخرون في النظام حالياً.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
