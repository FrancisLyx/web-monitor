<template>
    <div>
        <h1>API Test</h1>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { firstAPI } from '@/api/common'

onMounted(() => {
    firstAPI().then((res) => {
        console.log(res);
    })
})
</script>
