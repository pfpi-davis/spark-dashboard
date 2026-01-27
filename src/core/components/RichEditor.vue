<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

const editorRef = ref<HTMLElement | null>(null);
let quillInstance: any = null; // Use 'any' to avoid TS conflicts with v1 vs v2 types

onMounted(() => {
    if (!editorRef.value) return;

    // 1. Initialize Quill manually
    quillInstance = new Quill(editorRef.value, {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'header': [1, 2, 3, false] }],
                ['clean']
            ]
        }
    });

    // 2. Set Initial Content safely
    if (props.modelValue) {
        // dangerouslyPasteHTML is the robust way to set content in Quill v1
        quillInstance.clipboard.dangerouslyPasteHTML(0, props.modelValue);
    }

    // 3. Listen for changes
    quillInstance.on('text-change', () => {
        if (quillInstance) {
            const html = quillInstance.root.innerHTML;
            emit('update:modelValue', html === '<p><br></p>' ? '' : html);
        }
    });
});

// 4. Handle external updates
watch(() => props.modelValue, (newVal) => {
    if (quillInstance && newVal !== quillInstance.root.innerHTML) {
        // Only update if content is different to prevent cursor jumps
        const currentContent = quillInstance.root.innerHTML;
        if (newVal !== currentContent) {
            quillInstance.clipboard.dangerouslyPasteHTML(0, newVal);
        }
    }
});

// 5. Cleanup
onBeforeUnmount(() => {
    quillInstance = null;
});
</script>

<template>
    <div class="rich-editor-wrapper">
        <div ref="editorRef" class="editor-container"></div>
    </div>
</template>

<style scoped>
.rich-editor-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background: white;
}

.editor-container {
    flex: 1;
    overflow-y: auto;
    font-family: inherit;
}

:deep(.ql-toolbar) {
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 1px solid #ddd !important;
    background: #f8f9fa;
}

:deep(.ql-container) {
    border: none !important;
    font-size: 1rem;
}
</style>