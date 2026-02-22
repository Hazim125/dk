import { useUser, useUpdateProfile } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Shield, Trash2, Save } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: user, isLoading: userLoading } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");

  // جلب قائمة الموظفين للحذف
  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // دالة الحذف
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
        {/* تعديل البيانات الشخصية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> تعديل بياناتي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              onClick={() => updateProfileMutation.mutate({ name, bio })}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        {/* عرض الرتبة الحالية */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="text-center">
             <Avatar className="h-20 w-20 mx-auto mb-2">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback>{user?.name?.slice(0,2)}</AvatarFallback>
             </Avatar>
             <CardTitle>{user?.name}</CardTitle>
             <p className="text-primary font-bold">{user?.role === 'admin' ? 'مدير نظام (Dark)' : 'موظف'}</p>
          </CardHeader>
        </Card>
      </div>

      {/* قسم إدارة الموظفين - يظهر للآدمن فقط */}
      {user?.role === 'admin' && (
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Shield className="h-5 w-5" /> إدارة الموظفين (حذف)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {users?.filter(u => u.id !== user.id).map((employee) => (
                <div key={employee.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{employee.name?.slice(0,2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">@{employee.username}</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if(confirm(`هل أنت متأكد من حذف ${employee.name}؟`)) {
                        deleteMutation.mutate(employee.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
