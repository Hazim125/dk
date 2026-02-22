import { useUser } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Shield } from "lucide-react";

export default function Settings() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        لم يتم العثور على بيانات المستخدم.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <h1 className="text-3xl font-bold">الملف الشخصي</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-primary/5">
                  {user.name?.slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.name}</CardTitle>
            <Badge variant="secondary" className="mt-2">
              {user.role === "admin" ? "مدير النظام" : "موظف"}
            </Badge>
          </CardHeader>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">اسم المستخدم</p>
                <p className="font-medium">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">الرتبة</p>
                <p className="font-medium">{user.role === "admin" ? "Admin" : "Employee"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} // تأكد إن ده آخر قوس في الملف ومفيش أي حاجة بعده
