import { ref, unref, onActivated } from 'vue';
import { CommandNode } from '@src/platform/common/types';
import { CommandType, SrcType, ValueType } from '@src/platform/common/enum';
import componentSender from '/@/ipc/component';
import { IGroupMeta } from '@src/platform/group/group';

type IMenuGroup = IGroupMeta & {
  open?: boolean;
  children: CommandNode[];
};
export function useCommandList() {
  const menuList = ref<IMenuGroup[]>();
  const innerGroup = ref<IMenuGroup>({
    id: 'flow-command',
    desc: '流程控制操作',
    key: '@FlowUtil',
    name: '流程控制',
    open: true,
    diffPlatform: false,
    children: [
      {
        id: 'if',
        name: 'If 条件',
        type: CommandType.If,
        formType: CommandType.If,
        leftSrcType: SrcType.Input,
        leftValue: '',
        operator: '==',
        rightSrcType: SrcType.Input,
        rightValue: '',
      },
      {
        id: 'elseif',
        name: 'Else If',
        type: CommandType.ElseIf,
        formType: CommandType.If,
        leftSrcType: SrcType.Input,
        leftValue: '',
        operator: '==',
        rightSrcType: SrcType.Input,
        rightValue: '',
      },
      {
        id: 'else',
        name: 'Else',
        type: CommandType.Else,
        formType: CommandType.Else,
      },
      {
        id: 'foreach',
        name: 'ForEach',
        type: CommandType.ForEach,
        formType: CommandType.ForEach,
        srcType: SrcType.Input,
        items: '',
        output: {
          name: '输出',
          key: 'output',
          type: ValueType.Unknown,
        },
      },
    ],
  });

  async function getMenuList() {
    const groupComponentList = (await componentSender.getGroupComponentList()) as IMenuGroup[];
    const list = groupComponentList.map((item) => {
      item.open = true;
      return item;
    });
    return [unref(innerGroup), ...list];
  }

  onActivated(async () => {
    menuList.value = await getMenuList();
  });

  return {
    menuList,
  };
}
