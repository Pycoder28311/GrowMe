import { ASSETS } from './layout'

/**
 * The script of the sun bar and duration boxes. Each field that needs it renders this tag; the
 * browser loads the file once and the script sets itself up only once.
 */
export const WidgetsScript = () => <script src={`${ASSETS.widgets.path}?v=${ASSETS.widgets.version}`} defer />
