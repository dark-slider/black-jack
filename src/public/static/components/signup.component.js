const onSignup = async () => {
  const input = document.getElementById('signupInput')
  input.classList.remove('danger')

  if (!input.value) {
    input.classList.add('danger')
    return
  }
  try {
    const { data } = await sendRequest.post('/auth/signup', {email: input.value})
    localStorage.setItem('token', data.token)

    await player.getMe()

    startSocket()
    window.location.href = routes.dashboard
  } catch (error) {
    input.classList.add('danger')
    console.error(error.response.data)
  }
}

const signupComponent = () => `
<div class="layout">
    <div>
        <input placeholder="Email:" id="signupInput">
        <button class="primary" onclick="onSignup()">Sign Up</button>
    </div>
    <div class="centred">
        <a href="${routes.login}">Log In</a>
    </div>  
</div>
`
