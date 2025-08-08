const canvas = document.getElementById('canvas');

if (!canvas) {
	throw new Error('Canvas element is required for rendering.');
}

const ctx = canvas.getContext('webgl');
if (!ctx) {
	throw new Error('WebGL context is not supported by this browser.');
}

