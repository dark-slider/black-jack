const onLogin = async () => {
  const input = document.getElementById('loginInput')
  input.classList.remove('danger')

  if (!input.value) {
    input.classList.add('danger')
    return
  }
  try {
    const { data } = await sendRequest.post('/auth/login', { email: input.value })
    localStorage.setItem('token', data.token)

    await player.getMe()

    startSocket()
    window.location.href = routes.dashboard
  } catch (error) {
    input.classList.add('danger')
    console.error(error.response.data)
  }
}

const loginComponent = () => `
<div class="layout">
    <p class="header">Log in</p>
    <div>
        <input placeholder="Email:" id="loginInput">
        <button class="primary" onclick="onLogin()">Login</button>
    </div>
    <div class="centred">
        <a href="${routes.signup}">Sign Up</a>
    </div>    
</div>
`
