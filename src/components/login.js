import axios from 'axios'

export default {
  name: 'LoginPage',
  emits: ['login-success'],

  data() {
    return {
      form: {
        username: '',
        password: '',
        remember: false,
      },
      showPassword: false,
      loading: false,
      loginSuccess: false,
      displayName: '',
      errorMsg: '',
      errorKey: 0,
      fieldErrors: {
        username: '',
        password: '',
      },
    }
  },

  methods: {
    focusPassword() {
      this.$refs.passwordField.focus()
    },

    clearError(field) {
      this.fieldErrors[field] = ''
      this.errorMsg = ''
    },

    validate() {
      let valid = true
      this.fieldErrors = {
        username: '',
        password: '',
      }

      if (!this.form.username) {
        this.fieldErrors.username = 'Username is required'
        valid = false
      }

      if (!this.form.password) {
        this.fieldErrors.password = 'Password is required'
        valid = false
      }

      return valid
    },

    async handleLogin() {
      if (this.loading) return
      if (!this.validate()) return

      this.loading = true
      this.errorMsg = ''

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_API_URL}/auth/login/`,
          {
            username: this.form.username,
            password: this.form.password,
          }
        )

        localStorage.setItem('accessToken', response.data.access)
        localStorage.setItem('refreshToken', response.data.refresh)

        this.displayName = this.form.username
        this.loginSuccess = true

        setTimeout(() => {
          this.$emit('login-success')
        }, 1200)
      } catch (error) {
        const detail = error?.response?.data?.detail
        this.errorMsg = detail || 'Incorrect username or password. Please try again.'
        this.errorKey += 1
        this.form.password = ''
        this.showPassword = false
      } finally {
        this.loading = false
      }
    },
  },
}