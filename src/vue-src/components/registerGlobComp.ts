import type { App } from 'vue';
import { Button } from './Button';
import { PageWrapper } from './Page';
import {
  // Need
  Input,
  Select,
  Layout,
  Row,
  Col,
} from 'ant-design-vue';

export function registerGlobComp(app: App) {
  app.use(Input).use(Select).use(Button).use(Layout).use(PageWrapper).use(Row).use(Col);
}
