<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits(['update:modelValue', 'drop-custom']);

const editorRef = ref<HTMLElement | null>(null);
let quillInstance: any = null;

// Expose methods to parent (WriterMain)
defineExpose({
    insertHTML: (html: string) => {
        if (quillInstance) {
            // Focus first to ensure we have a valid range
            quillInstance.focus();
            const range = quillInstance.getSelection(true); // true = ignore focus
            if (range) {
                quillInstance.clipboard.dangerouslyPasteHTML(range.index, html, 'user');
                quillInstance.setSelection(range.index + html.length);
            } else {
                // Fallback: Append to end if no selection found
                const length = quillInstance.getLength();
                quillInstance.clipboard.dangerouslyPasteHTML(length, html, 'user');
            }
        }
    },
    getQuill: () => quillInstance
});

onMounted(() => {
    if (!editorRef.value) return;

    quillInstance = new Quill(editorRef.value, {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'header': [1, 2, 3, false] }],
                ['link', 'clean']
            ]
        }
    });

    if (props.modelValue) {
        quillInstance.clipboard.dangerouslyPasteHTML(0, props.modelValue);
    }

    quillInstance.on('text-change', () => {
        if (quillInstance) {
            const html = quillInstance.root.innerHTML;
            emit('update:modelValue', html === '<p><br></p>' ? '' : html);
        }
    });

    // --- DRAG & DROP FIXES ---

    // 1. MUST preventDefault on dragover to allow dropping
    quillInstance.root.addEventListener('dragover', (e: DragEvent) => {
        if (e.dataTransfer && e.dataTransfer.types.includes('application/spark-citation')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    });

    // 2. Handle the Drop
    quillInstance.root.addEventListener('drop', (e: DragEvent) => {
        if (e.dataTransfer && e.dataTransfer.types.includes('application/spark-citation')) {
            e.preventDefault();
            const data = e.dataTransfer.getData('application/spark-citation');
            try {
                emit('drop-custom', JSON.parse(data));
            } catch (err) {
                console.error("Failed to parse dropped data", err);
            }
        }
    });
});

watch(() => props.modelValue, (newVal) => {
    if (quillInstance && newVal !== quillInstance.root.innerHTML) {
        const currentContent = quillInstance.root.innerHTML;
        if (newVal !== currentContent) {
            quillInstance.clipboard.dangerouslyPasteHTML(0, newVal);
        }
    }
});

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