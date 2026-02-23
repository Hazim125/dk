import { useUser, useUpdateProfile } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Shield, Trash2, Save, Upload, MessageCircle } from "lucide-react";
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

  const { data: allUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" })
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (userLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto p-4 space-y-8" dir="rtl">
      <h1 className="text-3xl font-bold">الإعدادات والملفات الشخصية</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>تعديل بياناتي</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20"><AvatarImage src={avatarUrl} /></Avatar>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea label="النبذة" value={bio} onChange={(e) => setBio(e.target.value)} />
            <Button className="w-full" 
              onClick={() => updateProfileMutation.mutate({ name, bio, avatarUrl })}
              disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 flex flex-col items-center justify-center p-6 border-dashed">
          <Avatar className="h-32 w-32 border-4 border-background mb-4"><AvatarImage src={avatarUrl} /></Avatar>
          <h2 className="text-2xl font-bold">{name}</h2>
          <Badge className="mt-2">{user?.role === 'admin' ? '🛡️ مدير نظام' : '👤 موظف'}</Badge>
          <p className="mt-4 text-center text-muted-foreground">{bio || "لا توجد نبذة"}</p>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>أعضاء الفريق (عرض وتواصل)</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {allUsers?.map((u) => (
            <div key={u.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={u.avatarUrl} /><AvatarFallback>{u.name?.slice(0,2)}</AvatarFallback></Avatar>
                <div>
                  <p className="font-bold">{u.name} {u.id === user?.id && "(أنت)"}</p>
                  <p className="text-xs text-muted-foreground">{u.role === 'admin' ? 'المدير' : 'موظف'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/?text=مرحباً ${u.name}`)}>
                  <MessageCircle className="h-4 w-4 ml-2" /> تواصل
                </Button>
                {user?.role === 'admin' && u.id !== user.id && (
                  <Button size="sm" variant="destructive" onClick={() => confirm(`حذف ${u.name}؟`) && deleteMutation.mutate(u.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
