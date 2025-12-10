# Guía de Despliegue en Vercel (Admin Dashboard)

Este documento detalla cómo desplegar el Admin Dashboard en Vercel utilizando la estrategia de **Git Subtree**.

## 🔄 Estrategia de Git Subtree

Mantenemos el código dentro del monorepo principal, pero sincronizamos la carpeta `admin-dashboard` con un repositorio separado (`nevadotrekadminpanel`) que Vercel observa.

### Configuración Inicial (Solo una vez)

1.  **Repo Remoto**: Asegúrate de tener el remoto configurado en tu repo local:
    ```bash
    git remote add admin-remote https://github.com/ChrisBeep98/nevadotrekadminpanel.git
    ```

### Cómo Desplegar (Cada vez)

1.  Realiza tus cambios y haz commit en el repo principal.
2.  Ejecuta el siguiente comando desde la raíz del proyecto (`nevado-trek-backend`):
    ```bash
    git subtree push --prefix admin-dashboard admin-remote main
    ```
3.  Vercel detectará el push y comenzará el build automáticamente.

---

## ⚙️ Configuración en Vercel

### Variables de Entorno
Es **CRÍTICO** configurar las siguientes variables en el panel de Vercel (Settings > Environment Variables):

| Variable | Descripción | Valor (Ejemplo) |
|----------|-------------|-----------------|
| `VITE_API_URL` | URL del Backend | `https://api-wgfhwjbpva-uc.a.run.app/api` |
| `VITE_ADMIN_SECRET_KEY`| Clave Secreta Admin | **[VER SECRETS]** |

> **Nota**: `VITE_ADMIN_SECRET_KEY` es necesaria para que la aplicación firme las peticiones al backend.

### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## 🧪 Tests en CI/CD

Actualmente, los tests E2E (`src/__tests__`) están **EXCLUIDOS** del build de producción en Vercel mediante `tsconfig.app.json` para evitar errores de compilación y reducir el tiempo de despliegue. Los tests deben ejecutarse localmente o en un pipeline de CI dedicado antes de desplegar.
