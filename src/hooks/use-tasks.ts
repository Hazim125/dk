import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateTaskRequest, type UpdateTaskRequest, type TaskResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path);
      if (!res.ok) throw new Error("فشل تحميل المهام");
      return await res.json() as TaskResponse[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (task: CreateTaskRequest) => {
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error("فشل إنشاء المهمة");
      return await res.json() as TaskResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({
        title: "تمت العملية بنجاح",
        description: "تم إنشاء المهمة الجديدة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "لم نتمكن من إنشاء المهمة",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateTaskRequest) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("فشل تحديث المهمة");
      return await res.json() as TaskResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المهمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "لم نتمكن من تحديث المهمة",
        variant: "destructive",
      });
    },
  });
}
