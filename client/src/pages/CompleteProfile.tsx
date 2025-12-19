import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { maskCPF, maskPhone, validateCPF, validatePhone } from "@/lib/validators";

export default function CompleteProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [name, setName] = useState(user?.name || '');
  const [cpf, setCpf] = useState(user?.cpf ? maskCPF(user.cpf) : '');
  const [phone, setPhone] = useState(user?.phone ? maskPhone(user.phone) : '');
  
  const updateProfileMutation = trpc.user.updateProfile.useMutation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    if (!validateCPF(cpf)) {
      toast.error('CPF inválido');
      return;
    }
    
    if (!validatePhone(phone)) {
      toast.error('Telefone inválido');
      return;
    }
    
    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        cpf,
        phone,
      });
      
      toast.success('Cadastro completado com sucesso!');
      setLocation('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao completar cadastro');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Complete seu Cadastro</CardTitle>
            <CardDescription>
              Para continuar, precisamos de algumas informações adicionais
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email não pode ser alterado
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Salvando...' : 'Completar Cadastro'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
