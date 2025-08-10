(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function n(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(r){if(r.ep)return;r.ep=!0;const a=n(r);fetch(r.href,a)}})();function O(t){return new Promise((e,n)=>{const o=new Image;o.crossOrigin="anonymous",o.onload=()=>e(o),o.onerror=()=>n(new Error(`Failed to load image: ${t}`)),o.src=t})}function G(t,e,n){const o=t.createShader(e);if(!o)throw new Error("Failed to create shader");if(t.shaderSource(o,n),t.compileShader(o),!t.getShaderParameter(o,t.COMPILE_STATUS)){const r=t.getShaderInfoLog(o);throw t.deleteShader(o),new Error(`Shader compile failed: ${r}`)}return o}function W(t,e,n){const o=t.createProgram();if(!o)throw new Error("Failed to create program");const r=G(t,t.VERTEX_SHADER,e),a=G(t,t.FRAGMENT_SHADER,n);if(t.attachShader(o,r),t.attachShader(o,a),t.linkProgram(o),!t.getProgramParameter(o,t.LINK_STATUS)){const c=t.getProgramInfoLog(o);throw t.deleteProgram(o),new Error(`Program link failed: ${c}`)}return o}const V=`
attribute vec2 a_pos;
attribute vec2 a_uv;

uniform mat4 u_projection;
uniform vec2 u_translation;
uniform vec2 u_scale;

varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  vec2 pos = a_pos * u_scale + u_translation;
  gl_Position = u_projection * vec4(pos, 0.0, 1.0);
}
`,z=`
precision highp float;

uniform sampler2D u_texture;
uniform vec4 u_color;
uniform float u_pxRange;

varying vec2 v_uv;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {
  vec3 sample = texture2D(u_texture, v_uv).rgb;
  float sd = median(sample.r, sample.g, sample.b) - 0.5;

  float smoothing = u_pxRange * 0.5;

  float alpha = smoothstep(-smoothing, smoothing, sd);

  gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
}
`,N=new Float32Array([0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,1,1,0,1,0,1,1,1,1]);class j{gl;atlases;pixelRange;buffer;constructor(e,n){this.gl=e,this.atlases={},this.pixelRange=n;const o=e.createBuffer();if(!o)throw new Error("Failed to create buffer");this.buffer=o,e.bindBuffer(e.ARRAY_BUFFER,this.buffer),e.bufferData(e.ARRAY_BUFFER,N,e.DYNAMIC_DRAW)}addAtlas(e,n,o){const r=this.gl,a=r.createTexture();if(!a)throw new Error("Failed to create texture");r.bindTexture(r.TEXTURE_2D,a),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,o),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),this.atlases[e]={data:n,width:o.width,height:o.height,texture:a}}setupAttributes(e){const n=this.gl;n.bindBuffer(n.ARRAY_BUFFER,this.buffer);const o=n.getAttribLocation(e,"a_pos"),r=n.getAttribLocation(e,"a_uv");n.enableVertexAttribArray(o),n.vertexAttribPointer(o,2,n.FLOAT,!1,16,0),n.enableVertexAttribArray(r),n.vertexAttribPointer(r,2,n.FLOAT,!1,16,8)}measureTextWidth(e,n,o){const r=this.atlases[o];if(!r)throw new Error(`Atlas with key "${o}" not found`);const a=n/r.data.info.size;let c=0;for(let u=0;u<e.length;u++){const l=e.charCodeAt(u),s=r.data.chars.find(h=>h.id===l);if(!s){c+=a*r.data.info.size*.5;continue}c+=s.xadvance*a}return c}renderText(e,n,o,r,a,c,u){const l=this.atlases[u];if(!l)throw new Error(`Atlas with key "${u}" not found`);const s=this.gl;s.bindTexture(s.TEXTURE_2D,l.texture);const h=a/l.data.info.size;let g=o,f=r;const U=s.getUniformLocation(e,"u_color"),A=s.getUniformLocation(e,"u_pxRange"),w=s.getUniformLocation(e,"u_scale"),y=s.getUniformLocation(e,"u_translation");s.uniform4f(U,c[0],c[1],c[2],c[3]),s.uniform1f(A,this.pixelRange/l.height);for(let _=0;_<n.length;_++){const b=n.charCodeAt(_),d=l.data.chars.find(i=>i.id===b);if(!d){g+=h*l.data.info.size*.5;continue}const R=d.x/l.width,T=(d.x+d.width)/l.width,x=d.y/l.height,P=(d.y+d.height)/l.height,p=d.width,v=d.height,F=g+d.xoffset*h,S=f+d.yoffset*h;s.uniform2f(w,p*h,v*h),s.uniform2f(y,F,S);const L=new Float32Array([0,0,R,x,1,0,T,x,0,1,R,P,0,1,R,P,1,0,T,x,1,1,T,P]),m=new Float32Array(24);for(let i=0;i<6;i++)m[i*4+0]=N[i*4+0],m[i*4+1]=N[i*4+1],m[i*4+2]=L[i*4+2],m[i*4+3]=L[i*4+3];s.bindBuffer(s.ARRAY_BUFFER,this.buffer),s.bufferSubData(s.ARRAY_BUFFER,0,m),s.drawArrays(s.TRIANGLES,0,6),g+=d.xadvance*h}}}function H(t){const e=[];for(let n=0;n<t.length;n++){const[o,r]=t[n];e.push(o,-1),e.push(o,r)}return new Float32Array(e)}function $(t,e,n){if(e.length===0)return;const o=n?.color||[.2,.7,1,1],r=n?.fillColor||[.2,.7,1,.3],a=n?.lineWidth,c=e.map(i=>i[0]),u=e.map(i=>i[1]),l=Math.min(...c),s=Math.max(...c),h=Math.min(...u),g=Math.max(...u),f=.2,U=0,A=e.flatMap(([i,B])=>[(i-l)/(s-l)*2-1,((B-h)/(g-h)*2-1)*f+U]),_=W(t,`
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `,`
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `);t.useProgram(_);const b=t.getAttribLocation(_,"a_pos"),d=t.getUniformLocation(_,"u_color"),R=H(A.reduce((i,B,C)=>(C%2===0&&i.push([B,A[C+1]]),i),[])),T=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,T),t.bufferData(t.ARRAY_BUFFER,R,t.STATIC_DRAW);const p=W(t,`
    attribute vec2 a_pos;
    varying float v_y;
    void main() {
      v_y = (a_pos.y + 1.0) / 2.0; // Normalize y to [0, 1]
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `,`
    precision mediump float;
    uniform vec4 u_color_start;
    uniform vec4 u_color_end;
    varying float v_y;
    void main() {
      gl_FragColor = mix(u_color_start, u_color_end, v_y);
    }
  `);t.useProgram(p);const v=t.getAttribLocation(p,"a_pos"),F=t.getUniformLocation(p,"u_color_start"),S=t.getUniformLocation(p,"u_color_end");t.bindBuffer(t.ARRAY_BUFFER,T),t.enableVertexAttribArray(v),t.vertexAttribPointer(v,2,t.FLOAT,!1,0,0),t.uniform4fv(F,r),t.uniform4fv(S,[1,1,1,0]),t.drawArrays(t.TRIANGLE_STRIP,0,R.length/2),t.useProgram(_);const L=new Float32Array(A),m=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,m),t.bufferData(t.ARRAY_BUFFER,L,t.STATIC_DRAW),t.vertexAttribPointer(b,2,t.FLOAT,!1,0,0),t.uniform4fv(d,o),t.lineWidth(a),t.drawArrays(t.LINE_STRIP,0,e.length)}function Y(t,e,n){const o=[];let r=e;for(let a=0;a<t;a++){const c=(Math.random()*2-1)*n;r+=r*c,r=Math.round(r*100)/100,o.push([a,r])}return o}(async()=>{const t=document.getElementById("canvas"),e=t.getContext("webgl");if(!e){alert("WebGL not supported");return}const n=48,[o,r,a,c]=await Promise.all([O("/atlas_regular.png"),fetch("/atlas_regular.json").then(E=>E.json()),O("/atlas_bold.png"),fetch("/atlas_bold.json").then(E=>E.json())]),u=W(e,V,z);e.useProgram(u);const l=e.createTexture();if(!l)throw new Error("Failed to create texture");e.bindTexture(e.TEXTURE_2D,l),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.viewport(0,0,t.width,t.height),e.clearColor(1,1,1,1),e.clear(e.COLOR_BUFFER_BIT);function s(E,I,X,M){return new Float32Array([2/(I-E),0,0,0,0,2/(M-X),0,0,0,0,-1,0,-(I+E)/(I-E),-(M+X)/(M-X),0,1])}const h=s(0,t.width,t.height,0),g=e.getUniformLocation(u,"u_projection");e.uniformMatrix4fv(g,!1,h);const f=new j(e,n);f.addAtlas("regular",r,o),f.addAtlas("bold",c,a),f.setupAttributes(u);const U="BTC / USDT · Binance",A=24,w="BTC / USDT",y=24,_=f.measureTextWidth(w,y,"bold"),b=(t.width-f.measureTextWidth(U,A,"regular"))/2,d=" · Binance",R=b+_,T="114,900.00",x=48,P=f.measureTextWidth(T,x,"bold"),p=(t.width-P)/2,v="1.00%",F=20,S=f.measureTextWidth(v,F,"regular"),L=(t.width-S)/2-40,m="1,140.87",i=20,B=f.measureTextWidth(m,i,"regular"),C=(t.width-B)/2+40,D=Y(200,38.5,.005);setInterval(()=>{const E=D[D.length-1],I=Y(1,E[1],.005)[0];D.push([E[0]+1,I[1]]),D.shift(),e.clearColor(1,1,1,1),e.clear(e.COLOR_BUFFER_BIT),e.useProgram(u),e.bindTexture(e.TEXTURE_2D,l),f.setupAttributes(u),f.renderText(u,w,b,40,y,[.4,.4,.4,1],"bold"),f.renderText(u,d,R,40,A,[.5,.5,.5,1],"regular"),f.renderText(u,T,p,70,x,[0,0,0,1],"bold"),f.renderText(u,v,L,130,F,[0,0,1,1],"regular"),f.renderText(u,m,C,130,i,[0,0,1,1],"regular"),$(e,D,{color:[1,.5,0,1],lineWidth:10,fillColor:[0,.5,1,.8]})},300)})();
