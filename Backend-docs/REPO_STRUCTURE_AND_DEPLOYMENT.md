# Estructura del Repositorio y Estrategia de Despliegue

Este repositorio opera como un **Monorepo Híbrido** que contiene tanto el Backend (Cloud Functions) como el Frontend (Admin Dashboard).

## 📂 Estructura de Carpetas

- **`/` (Raíz)**: Contiene la configuración global y documentación del backend.
- **`/functions`**: Código del Backend (Firebase Cloud Functions).
- **`/admin-dashboard`**: Código del Frontend (React/Vite).
- **`/Backend-docs`**: Documentación técnica del backend.

## 🚀 Estrategia de Despliegue

### Backend (Firebase)
El backend se despliega directamente desde la raíz a Firebase Cloud Functions.
```bash
firebase deploy --only functions
```

### Frontend (Vercel)
El Admin Dashboard se despliega en **Vercel** usando una estrategia de **Git Subtree**.

#### ¿Por qué Git Subtree?
Vercel prefiere repositorios donde el proyecto sea la raíz (para detectar `package.json` y configuraciones automáticamente). Para no separar el código en dos repositorios desconectados, usamos `git subtree` para sincronizar la carpeta `/admin-dashboard` con un repositorio "satélite" en GitHub.

- **Repo Principal**: Contiene TODO el código (Backend + Admin).
- **Repo Satélite (`nevadotrekadminpanel`)**: Contiene SOLO el contenido de `/admin-dashboard`.

#### Flujo de Trabajo
1.  Desarrollas y haces commit en el repo principal normalmente.
2.  Para desplegar el frontend, empujas solo la subcarpeta al repo satélite:
    ```bash
    git subtree push --prefix admin-dashboard admin-remote main
    ```
3.  Vercel detecta el cambio en el repo satélite y despliega automáticamente.

Para más detalles sobre la configuración del frontend, ver `admin-dashboard/frontend-docs/DEPLOYMENT.md`.
