# Estructura del Repositorio y Estrategia de Despliegue

Este repositorio opera como un **Monorepo Híbrido** que contiene tanto el Backend (Cloud Functions) como el Frontend (Admin Dashboard).

## 📂 Estructura de Carpetas

- **`/` (Raíz)**: Contiene la configuración global y documentación del backend.
- **`/functions`**: Código del Backend (Firebase Cloud Functions).
- **`/admin-dashboard`**: Código del Frontend (React/Vite).
- **`/Backend-docs`**: Documentación técnica del backend.

## 🚀 Estrategia de Despliegue

### Backend (Firebase)

Operamos con una estrategia de **Doble Entorno** para garantizar la estabilidad de producción.

#### 1. Entornos Disponibles

| Entorno | Alias CLI | Project ID | Uso |
|---------|-----------|------------|-----|
| **Staging** | `staging` | `nevado-trek-backend-03` | Pruebas, desarrollo de nuevas features, integración frontend. |
| **Producción** | `prod` | `nevadotrektest01` | **SOLO** código verificado y estable. Clientes reales. |

#### 2. Comandos de Despliegue

**Desplegar a Staging (Recomendado para Dev)**
```bash
firebase use staging
firebase deploy --only functions
```

**Desplegar a Producción (Solo Releases)**
```bash
firebase use prod
firebase deploy --only functions
```

#### Configuración de Dominio Personalizado (API)
Actualmente la API se accede vía la URL predeterminada de Google Cloud Run: `https://api-wgfhwjbpva-uc.a.run.app`. 

Si deseas usar un dominio personalizado (ej. `api.nevado-trek.com`):
1.  **Firebase Hosting**: Se recomienda usar Firebase Hosting como "proxy" para las funciones.
2.  **Configuración en `firebase.json`**:
    ```json
    {
      "hosting": {
        "rewrites": [
          {
            "source": "/api/**",
            "function": "api"
          }
        ]
      }
    }
    ```
3.  **Dominio**: Conectar el dominio `nevado-trek.com` en la consola de Firebase (Hosting -> Custom Domain).
4.  **Resultado**: La API será accesible en `https://nevado-trek.com/api/public/...`.

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
