# Sistema de Gerenciamento de Sessões

Este guia explica como configurar e usar o sistema completo de gerenciamento de sessões com anti-fraude implementado no appFigtor.

## 🛠️ Configuração Inicial

### 1. Instalar Dependências

```bash
# Instalar tipos TypeScript necessários
pnpm add -D @types/pg @types/bcryptjs @types/ua-parser-js
```

### 2. Configurar Banco de Dados

Execute o SQL no seu PostgreSQL:

```bash
# Executar o arquivo de criação das tabelas
psql -U seu_usuario -d sua_database -f session-tables.sql
```

Ou execute diretamente o conteúdo do arquivo `session-tables.sql` no seu cliente PostgreSQL.

### 3. Variáveis de Ambiente

Certifique-se de ter estas variáveis no seu `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/figtor_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-muito-seguro-aqui"

# Para produção, definir NODE_ENV
NODE_ENV="development"
```

## 🚀 Funcionalidades Implementadas

### 1. **Sistema de Sessões por Dispositivo**
- Cada login cria uma sessão única por dispositivo
- Controle granular de sessões ativas
- Revogação individual ou em lote
- Rastreamento de atividade em tempo real

### 2. **Anti-Fraude Avançado**
- Fingerprinting de dispositivos
- Detecção de múltiplas contas por IP
- Bloqueio automático de atividades suspeitas
- Sistema de scoring de risco

### 3. **APIs Implementadas**

#### Login com Sessão
```typescript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "senha",
  "fingerprint": "hash_do_dispositivo"
}
```

#### Logout
```typescript
// POST /api/auth/logout
// Encerra sessão atual e limpa cookie
```

#### Gerenciar Sessões
```typescript
// GET /api/auth/sessions - Listar sessões
// DELETE /api/auth/sessions?sessionId=xxx - Revogar sessão específica
// DELETE /api/auth/sessions?action=all - Revogar todas exceto atual
// POST /api/auth/sessions - Verificar status da sessão
```

### 4. **Interface de Gerenciamento**

Acesse `/dashboard/sessions` para:
- Ver todas as sessões ativas
- Identificar dispositivos e localizações
- Encerrar sessões suspeitas
- Monitorar atividade em tempo real

## 📝 Como Usar

### 1. **Implementar Login com Fingerprint**

```tsx
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint'

function LoginForm() {
  const fingerprint = useDeviceFingerprint()

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fingerprint: fingerprint?.fingerprint
      })
    })

    if (response.ok) {
      // Redirecionar para dashboard
      router.push('/dashboard')
    }
  }
}
```

### 2. **Verificar Sessão em Componentes**

```tsx
import { getCurrentSession } from '@/lib/session-utils'

// Em Server Component
export default async function ProtectedPage() {
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/login')
  }

  return <div>Conteúdo protegido</div>
}
```

### 3. **Monitoramento de Sessões**

```tsx
// Hook para monitorar sessões em tempo real
function useSessionMonitoring() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/auth/sessions')
      const data = await response.json()
      setSessions(data.sessions)
    }, 30000) // Verificar a cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  return sessions
}
```

## 🔒 Segurança

### Medidas Implementadas

1. **Cookies Seguros**
   - HttpOnly, Secure, SameSite
   - Expiração automática em 30 dias

2. **Validação Dupla**
   - NextAuth para autenticação base
   - Sessão própria para controle granular

3. **Anti-Fraude**
   - Fingerprinting de dispositivo
   - Limitação por IP
   - Detecção de padrões suspeitos

4. **Auditoria**
   - Log completo de todas as sessões
   - Rastreamento de IP e dispositivo
   - Histórico de revogações

## 🐛 Troubleshooting

### Problemas Comuns

1. **Sessão não é criada**
   - Verificar se as tabelas foram criadas
   - Conferir conexão com banco
   - Validar cookies no navegador

2. **Middleware não funciona**
   - Verificar se `validateSession` não tem erros
   - Conferir matcher do middleware
   - Validar variáveis de ambiente

3. **Anti-fraude muito restritivo**
   - Ajustar parâmetros em `fraud-detection.ts`
   - Revisar lógica de scoring
   - Verificar logs de bloqueios

### Logs Úteis

```bash
# Verificar sessões ativas
SELECT * FROM "UserSession" WHERE "isActive" = true;

# Ver atividade suspeita
SELECT * FROM "FraudBlock" WHERE "isActive" = true;

# Estatísticas de uso
SELECT 
  COUNT(*) as total_sessions,
  COUNT(DISTINCT "userId") as unique_users,
  COUNT(DISTINCT "ipAddress") as unique_ips
FROM "UserSession";
```

## 📈 Monitoramento

### Métricas Recomendadas

1. **Taxa de sessões ativas**
2. **Número de dispositivos por usuário**
3. **Bloqueios por fraude**
4. **Tempo médio de sessão**
5. **Distribuição geográfica de IPs**

### Alertas Sugeridos

- Mais de 5 sessões do mesmo IP
- Usuário com mais de 10 dispositivos
- Picos de criação de contas
- Tentativas de login após bloqueio

## 🔄 Manutenção

### Tarefas Periódicas

```sql
-- Limpeza de sessões antigas (executar diariamente)
DELETE FROM "UserSession" 
WHERE "expires" < NOW() - INTERVAL '7 days';

-- Limpar fingerprints não utilizados
DELETE FROM "DeviceFingerprint" 
WHERE "updatedAt" < NOW() - INTERVAL '90 days'
  AND "id" NOT IN (
    SELECT DISTINCT "fingerprintId" 
    FROM "UserFingerprint"
  );
```

## 🚀 Próximos Passos

1. **Integração com Analytics**
   - Dashboards de uso
   - Relatórios de segurança

2. **Notificações**
   - Email para login suspeito
   - Push notifications

3. **Otimizações**
   - Cache de sessões
   - Índices adicionais no banco

---

✨ **Sistema implementado com sucesso!** Agora você tem controle completo sobre as sessões e segurança da aplicação.