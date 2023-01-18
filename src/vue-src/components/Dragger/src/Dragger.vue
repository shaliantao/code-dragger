<script setup lang="ts">
  import { ref, toRef, onMounted, nextTick, computed, watch } from 'vue';
  import { useElementSize } from '@vueuse/core';
  import { isMacintosh } from '@src/base/common/platform';
  import { IDirection } from './enum';

  const props = defineProps({
    direction: {
      type: String,
      default: IDirection.X,
      validator: function (value: IDirection) {
        return [IDirection.X, IDirection.Y].includes(value);
      },
    },
    prevMin: {
      type: Number,
      default: 0,
    },
    prevMax: {
      type: Number,
      default: 0,
    },
    nextMin: {
      type: Number,
      default: 0,
    },
    nextMax: {
      type: Number,
      default: 0,
    },
  });

  const colResize = isMacintosh ? 'col-resize' : 'ew-resize';
  const rowResize = isMacintosh ? 'row-resize' : 'ns-resize';

  const draggerRef = ref<HTMLDivElement>();
  const direction = toRef(props, 'direction');
  let isMousedown = false;

  function accordingDirection(x, y) {
    return direction.value === IDirection.X ? x : y;
  }

  const classObject = computed(() => {
    return {
      'x-direction': direction.value === IDirection.X,
      'y-direction': direction.value === IDirection.Y,
    };
  });

  function setBorder(dragger) {
    if (direction.value === IDirection.X) {
      dragger.style.borderBottom = '1px solid #efecec';
    } else {
      dragger.style.borderLeft = '1px solid #efecec';
    }
  }

  function dragControllerDiv(prevEl, nextEl, parentEl) {
    const dragger = draggerRef.value;
    if (!dragger) {
      return;
    }
    const initialCursor = accordingDirection(rowResize, colResize);

    dragger.style.cursor = initialCursor;
    setBorder(dragger);

    dragger.onmouseenter = function () {
      if (isMousedown) {
        return;
      }
      dragger.style.background = '#efecec';
    };

    dragger.onmouseleave = function () {
      if (isMousedown) {
        return;
      }
      dragger.style.background = 'transparent';
      setBorder(dragger);
    };
    // 鼠标按下事件
    dragger.onmousedown = function (e) {
      isMousedown = true;
      // 颜色改变提醒
      dragger.style.background = '#818181';
      const startCoord = accordingDirection(e.clientY, e.clientX);
      const prevLen = accordingDirection(prevEl.offsetHeight, prevEl.offsetWidth);
      const totalLen =
        accordingDirection(prevEl.offsetHeight, prevEl.offsetWidth) +
        accordingDirection(nextEl.offsetHeight, nextEl.offsetWidth);
      document.onmousemove = function (e) {
        const endCoord = accordingDirection(e.clientY, e.clientX);
        const moveLen = endCoord - startCoord; // 偏移量
        let newPrevLen = prevLen + moveLen;
        if (props.prevMin && newPrevLen < props.prevMin) {
          newPrevLen = props.prevMin;
        } else if (props.prevMax && newPrevLen > props.prevMax) {
          newPrevLen = props.prevMax;
        }
        if (props.nextMin && newPrevLen > totalLen - props.nextMin) {
          newPrevLen = totalLen - props.nextMin;
        } else if (props.nextMax && newPrevLen < totalLen - props.nextMax) {
          newPrevLen = totalLen - props.nextMax;
        }
        if (direction.value === IDirection.X) {
          dragger.style.top = newPrevLen;
          prevEl.style.height = `${newPrevLen}px`;
          nextEl.style.height = `${totalLen - newPrevLen}px`;
        } else {
          dragger.style.left = newPrevLen;
          prevEl.style.width = `${newPrevLen}px`;
          nextEl.style.width = `${totalLen - newPrevLen}px`;
        }
        parentEl.style.cursor = initialCursor;
      };
      // 鼠标松开事件
      document.onmouseup = function () {
        isMousedown = false;
        // 颜色恢复
        parentEl.style.cursor = '';
        dragger.style.background = 'transparent';
        document.onmousemove = null;
        document.onmouseup = null;
      };

      return false;
    };
  }

  function resize(prevEl, nextEl, parentEl) {
    const { width: widthRef, height: heightRef } = useElementSize(parentEl);
    watch([widthRef, heightRef], ([width, height], [prevWidth, prevHeight]) => {
      if (props.prevMin) {
        let nextLen = accordingDirection(height, width) - props.prevMin - 4;
        if (props.nextMin && nextLen < props.nextMin) {
          nextLen = props.prevMin;
        }
        if (direction.value === IDirection.X) {
          if (prevHeight === 0) {
            nextEl.style.height = `${nextLen}px`;
            prevEl.style.height = `${props.prevMin}px`;
          }
        } else {
          if (width !== prevWidth) {
            nextEl.style.width = `${nextLen}px`;
            prevEl.style.width = `${props.prevMin}px`;
          }
        }
      }
      if (props.nextMin) {
        let prevLen = accordingDirection(height, width) - props.nextMin - 4;
        if (props.prevMin && prevLen < props.prevMin) {
          prevLen = props.prevMin;
        }
        if (direction.value === IDirection.X) {
          if (prevHeight === 0) {
            prevEl.style.height = `${prevLen}px`;
            nextEl.style.height = `${props.nextMin}px`;
          }
        } else {
          if (width !== prevWidth) {
            prevEl.style.width = `${prevLen}px`;
            nextEl.style.width = `${props.nextMin}px`;
          }
        }
      }
    });
  }
  function init() {
    const dragger = draggerRef.value;
    if (!dragger) {
      return;
    }
    const prevEl = dragger.previousElementSibling;
    if (!prevEl) throw new Error('need prev node');
    const nextEl = dragger.nextElementSibling;
    if (!nextEl) throw new Error('need next node');
    const parentEl = dragger.parentElement;
    dragControllerDiv(prevEl, nextEl, parentEl);
    resize(prevEl, nextEl, parentEl);
  }

  onMounted(async () => {
    await nextTick();
    init();
  });
</script>

<template>
  <div ref="draggerRef" class="drag" :class="classObject" title="拖动调整大小"></div>
</template>

<style scoped>
  /*拖拽区div样式*/
  .drag {
    position: relative;
    background-size: cover;
    background-position: center;
    font-size: 32px;
    color: white;
  }

  .x-direction {
    height: 4px;
  }

  .y-direction {
    width: 4px;
  }
</style>
