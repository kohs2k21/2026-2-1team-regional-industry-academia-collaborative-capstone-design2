export type WorkspaceTab = 'trades' | 'patterns' | 'principles';
export type Screen = { view: WorkspaceTab | 'landing' | 'settings' | 'chat' } |
  { view: 'trade'; id: string } | { view: 'principle'; id: string };
export type NavigationAction = { type: 'push'; screen: Screen } | { type: 'tab'; tab: WorkspaceTab } | { type: 'back' };

// Tabs are peers. Details, settings and chat return to their actual entry screen.
export function navigateScreens(stack: Screen[], action: NavigationAction): Screen[] {
  if (action.type === 'back') return stack.length > 1 ? stack.slice(0, -1) : stack;
  if (action.type === 'tab') return [...(stack[0].view === 'landing' ? [stack[0]] : []), { view: action.tab }];
  const current = stack[stack.length - 1];
  if (JSON.stringify(current) === JSON.stringify(action.screen)) return stack;
  return [...stack, action.screen];
}
export function screenTab(screen: Screen): WorkspaceTab {
  return screen.view === 'principle' || screen.view === 'principles' ? 'principles' : screen.view === 'patterns' ? 'patterns' : 'trades';
}
