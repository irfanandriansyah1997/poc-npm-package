/////////////////////////////////////////////////////////////////////////////
// Compound Interface
/////////////////////////////////////////////////////////////////////////////

/**
 * A generic type for compound components that adds a static COMPONENT_NAME property.
 * Used to identify compound component children by their component name.
 *
 * @template T - The base props type of the component.
 * @template N - The literal string type for the component name.
 *
 * @example
 * interface TabProps {
 *   label: string;
 *   children: ReactNode;
 * }
 *
 * type TabComponent = GenericCompoundComponentType<TabProps, 'Tab'>;
 *
 * const Tab: TabComponent = ({ label, children }) => <div>{children}</div>;
 * Tab.COMPONENT_NAME = 'Tab';
 */
export type GenericCompoundComponentType<T, N extends string> = T & {
  COMPONENT_NAME: N;
};

/**
 * A utility type that removes the 'style' property from HTML element props.
 * Useful when you want to prevent inline styles on components.
 *
 * @template P - The HTML props type to modify.
 *
 * @example
 * type DivPropsWithoutStyle = GenericHTMLProps<React.HTMLAttributes<HTMLDivElement>>;
 * // Has className, onClick, etc. but not style
 */
export type GenericHTMLProps<P> = Omit<P, 'style'>;
