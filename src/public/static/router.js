const router = (app) => {
  const token = localStorage.getItem('token')

  const privateRoute = async (component) => {
    if (!token) {
      window.location.hash = '#login'
    } else {
      app.innerHTML = await component()
    }
  }

  const publicRoute = (component) => {
    if (token) {
      window.location.hash = routes.dashboard
    }

    app.innerHTML = component()
  }

  switch (window.location.hash) {
    case routes.login:
      publicRoute(loginComponent)
      break

    case routes.signup:
      publicRoute(signupComponent)
      break

    case routes.dashboard:
      privateRoute(dashboardComponent)
      break

    case routes.game:
      privateRoute(gameComponent)
      break

    default:
      app.innerHTML = notFoundComponent()
  }
}




document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')

  router(app)

  window.addEventListener('hashchange', () => {
    router(app)
  })
})
