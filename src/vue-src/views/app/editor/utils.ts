import { cloneDeep } from 'lodash-es';
import { CommandNode, ParentNode, OutputArg } from '@src/platform/common/types';
import { CommandType } from '@src/platform/common/enum';
/**
 * 获取当前接点的前置输出接点
 * @param node 当前接点
 * @param parent 父节点链
 * @returns
 */
export function getOutputNodes(node: CommandNode, parent: ParentNode) {
  function setOutput(map, output) {
    const clonedOutput = cloneDeep(output);
    const { key } = clonedOutput;
    if (clonedOutput.children) {
      clonedOutput.children = clonedOutput.children.map((item) => {
        item.key = `${key}.${item.key}`;
        return item;
      });
    }
    map.set(key, clonedOutput);
  }

  // 获取当前节点所有前置节点和外层嵌套节点及其前置节点的输出
  const nodeMap = new Map<string, OutputArg>();
  let curNode: CommandNode | ParentNode = node;
  let curParent: ParentNode | undefined = parent;
  // 先根据parent从tasks列表查找
  while (curParent) {
    if (curParent.type === CommandType.ForEach && curParent?.output?.key) {
      setOutput(nodeMap, curParent.output);
    }
    for (const item of curParent.tasks!) {
      if (curNode.type !== CommandType.Top && item.id === curNode.id) {
        break;
      }
      if (
        (item.type === CommandType.Component || item.type === CommandType.Code) &&
        item?.output?.key
      ) {
        setOutput(nodeMap, item.output);
      }
    }
    curNode = curParent;
    curParent = curParent.parent;
  }
  return Array.from(nodeMap.values());
}
