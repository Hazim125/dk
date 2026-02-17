import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreateUserRequest, type UserResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useEmployees() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path);
      if (!res.ok) throw new Error("فشل تحميل الموظفين");
      return await res.json() as UserResponse[];
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employee: CreateUserRequest) => {
      const res = await fetch(api.users.create.path, {
        method: api.users.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "فشل إضافة الموظف");
      }
      return await res.json() as UserResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم تسجيل الموظف الجديد في النظام",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
