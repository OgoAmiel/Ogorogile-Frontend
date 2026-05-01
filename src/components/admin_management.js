import axios from 'axios'

export default {
  name: 'AdminManagement',
  emits: ['logout'],

  data() {
    return {
      currentTab: 'users',
      user: null,
      users: [],
      loading: true,
      submitting: false,
      errorMessage: '',
      successMessage: '',
      searchTerm: '',
      roleFilter: 'all',
      formMode: 'create',
      isUserModalOpen: false,
      userForm: {
        user_id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        employee_number: '',
        department: '',
        manager_id: '',
      },
    }
  },

  computed: {
    displayName() {
      if (!this.user) return 'Admin'
      const fullName = `${this.user.first_name || ''} ${this.user.last_name || ''}`.trim()
      return fullName || this.user.username || 'Admin'
    },

    displayRole() {
      if (!this.user?.role) return 'Admin'
      return this.capitalize(this.user.role.toLowerCase())
    },

    initials() {
      if (!this.user) return 'A'
      const first = this.user.first_name?.[0] || ''
      const last = this.user.last_name?.[0] || ''
      const fallback = this.user.username?.[0] || 'A'
      return `${first}${last}`.trim().toUpperCase() || fallback.toUpperCase()
    },

    pageTitle() {
      return 'Admin User Management'
    },

    pageSubtitle() {
      return 'Create, update, and manage system users'
    },

    totalUsers() {
      return this.users.length
    },

    totalEmployees() {
      return this.users.filter((userItem) => userItem.role === 'EMPLOYEE').length
    },

    totalManagers() {
      return this.users.filter((userItem) => userItem.role === 'MANAGER').length
    },

    filteredUsers() {
      return this.users.filter((userItem) => {
        const fullName = `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim().toLowerCase()
        const searchValue = this.searchTerm.trim().toLowerCase()

        const matchesSearch =
          !searchValue ||
          userItem.username.toLowerCase().includes(searchValue) ||
          fullName.includes(searchValue) ||
          (userItem.employee_number || '').toLowerCase().includes(searchValue) ||
          (userItem.department || '').toLowerCase().includes(searchValue) ||
          (userItem.email || '').toLowerCase().includes(searchValue)

        const matchesRole =
          this.roleFilter === 'all' || userItem.role === this.roleFilter

        return matchesSearch && matchesRole
      })
    },

    managerOptions() {
      return this.users.filter((userItem) => {
        if (userItem.role !== 'MANAGER' || !userItem.is_active) {
          return false
        }

        if (this.formMode === 'edit' && this.userForm.user_id === userItem.id) {
          return false
        }

        return true
      })
    },
  },

  async mounted() {
    await this.loadAdminPage()
  },

  methods: {
    getAuthHeaders() {
      const token = localStorage.getItem('accessToken')

      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    },

    async loadAdminPage() {
      this.loading = true
      this.errorMessage = ''
      this.successMessage = ''

      try {
        await Promise.all([
          this.fetchCurrentUser(),
          this.fetchUsers(),
        ])
      } catch (error) {
        console.error('Admin page load error:', error)
        this.errorMessage = 'Unable to load admin page.'
      } finally {
        this.loading = false
      }
    },

    async fetchCurrentUser() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_API_URL}/auth/me/`,
          {
            headers: this.getAuthHeaders(),
          }
        )

        this.user = response.data.data
      } catch (error) {
        console.error('Fetch current user error:', error)
        this.errorMessage = 'Unable to load current user details.'
      }
    },

    async fetchUsers() {
      this.loading = true
      this.errorMessage = ''

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_API_URL}/user_management/get_users/`,
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (response.data.status === 'success') {
          this.users = response.data.data || []
        } else {
          this.errorMessage = response.data.message || 'Failed to load users.'
        }
      } catch (error) {
        console.error('Fetch users error:', error)

        const message = error?.response?.data?.message

        if (typeof message === 'string') {
          this.errorMessage = message
        } else if (Array.isArray(message)) {
          this.errorMessage = message.join(' ')
        } else {
          this.errorMessage = 'Unable to load users.'
        }
      } finally {
        this.loading = false
      }
    },

    openCreateUserForm() {
      this.formMode = 'create'
      this.errorMessage = ''
      this.successMessage = ''
      this.resetForm()
      this.isUserModalOpen = true
    },

    openEditUserForm(userItem) {
      this.formMode = 'edit'
      this.errorMessage = ''
      this.successMessage = ''
      this.isUserModalOpen = true

      this.userForm = {
        user_id: userItem.id,
        username: userItem.username || '',
        first_name: userItem.first_name || '',
        last_name: userItem.last_name || '',
        email: userItem.email || '',
        password: '',
        role: userItem.role || 'EMPLOYEE',
        employee_number: userItem.employee_number || '',
        department: userItem.department || '',
        manager_id: userItem.manager_id || '',
      }
    },

    resetForm() {
      this.userForm = {
        user_id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        employee_number: '',
        department: '',
        manager_id: '',
      }
    },

    handleRoleChange() {
      if (this.userForm.role !== 'EMPLOYEE') {
        this.userForm.manager_id = ''
      }
    },

    validateForm() {
      if (!this.userForm.first_name.trim()) {
        return 'First name is required.'
      }

      if (!this.userForm.last_name.trim()) {
        return 'Last name is required.'
      }

      if (!this.userForm.email.trim()) {
        return 'Email is required.'
      }

      if (this.formMode === 'create' && !this.userForm.username.trim()) {
        return 'Username is required.'
      }

      if (this.formMode === 'create' && !this.userForm.password) {
        return 'Password is required.'
      }

      if (this.userForm.role === 'EMPLOYEE' && !this.userForm.manager_id) {
        return 'Employees must be assigned to a manager.'
      }

      return ''
    },

    buildCreatePayload() {
      return {
        username: this.userForm.username.trim(),
        first_name: this.userForm.first_name.trim(),
        last_name: this.userForm.last_name.trim(),
        email: this.userForm.email.trim(),
        password: this.userForm.password,
        role: this.userForm.role,
        employee_number: this.userForm.employee_number ? this.userForm.employee_number.trim() : null,
        department: this.userForm.department.trim(),
        manager_id: this.userForm.role === 'EMPLOYEE' && this.userForm.manager_id
          ? Number(this.userForm.manager_id)
          : null,
      }
    },

    buildUpdatePayload() {
      return {
        user_id: this.userForm.user_id,
        first_name: this.userForm.first_name.trim(),
        last_name: this.userForm.last_name.trim(),
        email: this.userForm.email.trim(),
        role: this.userForm.role,
        employee_number: this.userForm.employee_number ? this.userForm.employee_number.trim() : null,
        department: this.userForm.department.trim(),
        manager_id: this.userForm.role === 'EMPLOYEE' && this.userForm.manager_id
          ? Number(this.userForm.manager_id)
          : null,
      }
    },

    async createUser() {
      const payload = this.buildCreatePayload()

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}/user_management/create_user/`,
        payload,
        {
          headers: this.getAuthHeaders(),
        }
      )

      return response
    },

    async updateUser() {
      const payload = this.buildUpdatePayload()

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}/user_management/update_user/`,
        payload,
        {
          headers: this.getAuthHeaders(),
        }
      )

      return response
    },

    async submitUserForm() {
      if (this.submitting) {
        return
      }

      const validationMessage = this.validateForm()

      if (validationMessage) {
        this.errorMessage = validationMessage
        this.successMessage = ''
        return
      }

      this.submitting = true
      this.errorMessage = ''
      this.successMessage = ''

      try {
        const response = this.formMode === 'create'
          ? await this.createUser()
          : await this.updateUser()

        if (response.data.status === 'success') {
          this.successMessage = response.data.message || 'User saved successfully.'
          await this.fetchUsers()

          if (this.formMode === 'create') {
            this.resetForm()
          }

          this.closeUserModal()
        } else {
          this.errorMessage = response.data.message || 'Failed to save user.'
        }
      } catch (error) {
        console.error('Submit user form error:', error)

        const message = error?.response?.data?.message

        if (typeof message === 'string') {
          this.errorMessage = message
        } else if (Array.isArray(message)) {
          this.errorMessage = message.join(' ')
        } else if (typeof message === 'object' && message !== null) {
          this.errorMessage = Object.values(message).flat().join(' ')
        } else {
          this.errorMessage = 'Unable to save user.'
        }
      } finally {
        this.submitting = false
      }
    },

    closeUserModal() {
      this.isUserModalOpen = false
      this.errorMessage = ''
    },

    logoutUser() {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      this.$emit('logout')
    },

    formatUserName(userItem) {
      if (!userItem) return 'Unknown User'
      const fullName = `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim()
      return fullName || userItem.username || 'Unknown User'
    },

    formatRole(role) {
      return this.capitalize((role || '').toLowerCase())
    },

    capitalize(value) {
      if (!value) return ''
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
  },
}