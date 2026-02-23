import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest, type UserResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json() as UserResponse;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        throw new Error("فشل تسجيل الدخول");
      }
      return await res.json() as UserResponse;
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      toast({ title: "تم تسجيل الدخول بنجاح", description: `مرحباً بك، ${user.name}` });
    },
  });
}

// الـ Hook الجديد لتحديث الملف الشخصي (الاسم، البيو، الصورة)
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name?: string; bio?: string; avatarUrl?: string }) => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("فشل تحديث البيانات");
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData([api.auth.me.path], updatedUser);
      toast({ title: "تم التحديث", description: "تم حفظ بياناتك بنجاح" });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, { method: api.auth.logout.method });
      if (!res.ok) throw new Error("فشل تسجيل الخروج");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.invalidateQueries();
      toast({ title: "تم تسجيل الخروج", description: "إلى اللقاء!" });
    },
  });
}
