<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import LeaveManagement from './components/LeaveManagement.vue'

const isAuthenticated = ref(!!localStorage.getItem('accessToken'))

function handleLoginSuccess() {
  isAuthenticated.value = true
}

function handleLogout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  isAuthenticated.value = false
}
</script>

<template>
  <LoginPage
    v-if="!isAuthenticated"
    @login-success="handleLoginSuccess"
  />

  <LeaveManagement
    v-else
    @logout="handleLogout"
  />
</template>