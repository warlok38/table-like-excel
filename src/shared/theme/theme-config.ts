import type { ThemeConfig } from 'antd'

import { componentOverrides } from './overrides'

export const themeConfig: ThemeConfig = {
  token: {
    fontFamily: 'var(--font-montserrat), Arial, Helvetica, sans-serif',
    borderRadius: 5,
    colorPrimary: '#D9AD00',
    colorInfo: '#D9AD00',
    colorText: '#172033',
    controlHeight: 40,
    fontSize: 14
  },
  components: componentOverrides
}
