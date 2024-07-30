# Headless Custom Select Component

A lightweight, flexible, and fully customizable select component library with zero dependencies.

## Features

- Zero dependencies
- Highly customizable
- Single or multiple selections
- Grouping options
- Search functionality
- Keyboard navigation
- Accessible

## Installation

Since this is a vanilla JavaScript component with no dependencies, you can simply copy the [`index.min.js`](./index.min.js) file into your project. \
If you want to use it in your TypeScript project, you can simply copy the [`index.ts`](./index.ts) file.

## Usage

### Basic Usage

```javascript
const mySelect = window.customSelect('#my-select-container', {
  data: [
    {
      groupName: 'Fruits',
      options: ['Apple', 'Banana', 'Cherry', 'Date'],
    },
    {
      groupName: 'Vegetables',
      options: ['Carrot', 'Broccoli', 'Spinach'],
    },
  ],
  className: {
    container: 'relative',
    buttonContainer:
      'flex border rounded-md overflow-hidden data-[has-value=true]:border-blue-500 focus-within:ring-2',
    triggerButton: 'py-2 px-4 flex-1 text-left',
    deselectButton: 'pt-1 pb-1.5 px-3 bg-blue-300 text-white text-xl',
    dropdownContainer:
      'absolute top-full mt-0.5 w-full bg-white shadow-lg z-10 overflow-hidden rounded-md',
    helpText: 'py-1 px-4 text-sm border-b',
    searchInput: 'px-4 py-3 w-full outline-none shadow',
    optionsContainer: 'max-h-96 overflow-y-auto',
    optionGroup: 'bg-gray-50 border-t px-4 py-1 font-semibold text-sm',
    optionItem:
      'px-8 py-2 cursor-pointer hover:bg-gray-100 [&[aria-disabled]]:bg-gray-300 [&[aria-disabled]]:opacity-50',
    optionHighlighted: '!bg-blue-500 text-white',
    optionSelected: 'bg-blue-200',
  },
});
```

### Advanced Usage

Multiple selection with custom option object:

```javascript
/** @type {import('./index.d.ts').createCustomSelect} */
const customSelect = window.customSelect;

const myMultiSelect = customSelect('#my-multi-select-container', {
  isMultiple: true,
  enableSearch: false,
  data: [
    {
      groupName: 'Group 1',
      options: [
        { id: 1, name: 'Option 1', icon: '🍎' },
        { id: 2, name: 'Option 2', icon: '🍌' },
        { id: 3, name: 'Option 3', icon: '🍒' },
      ],
    },
  ],
  content: {
    optionItem: {
      label: (option, { isSelected }) => {
        const elm = document.createElement('div');
        elm.className = 'flex gap-3 items-center';
        elm.innerHTML = `
          <div>${option.icon}</div>
          <b>${option.name}</b>
          ${isSelected ? '<div>✓</div>' : ''}
        `;
        return elm;
      },
    },
  },
  className: {
    // ... custom class names
  },
});
```
