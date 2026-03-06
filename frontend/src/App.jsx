import './App.css'

function App() {
  return (
    <main>
      <h1>Register</h1>
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />

        <button type="submit">Register</button>
      </form>
    </main>
  )
}

export default App
