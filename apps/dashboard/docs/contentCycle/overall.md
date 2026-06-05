# ContentCycle Module Documentation

## Overview

The ContentCycle module is a comprehensive automation system for Instagram that allows users to create automated responses and interactions based on triggers and conditions. This module enables businesses to automate their Instagram marketing efforts by setting up content cycles that respond to direct messages and comments with predefined content.

## Architecture

The ContentCycle module is built with a modular architecture consisting of several key components:

1. **Main Components**
   - [`AutomationForm`](src/components/Automations/AutomationForm.tsx) - The main form component that orchestrates the entire automation creation/editing process
   - [`contentCycleTable`](src/components/Automations/contentCycleTable.tsx) - Displays a list of existing content cycles
   - [`contentCycleLeads`](src/components/Automations/contentCycleLeads.tsx) - Manages leads generated from Instagram interactions

2. **Form Sub-components**
   - [`Triggers`](src/components/Automations/Form/Triggers.tsx) - Handles trigger configuration (direct messages vs comments)
   - [`Conditions`](src/components/Automations/Form/Conditions.tsx) - Manages condition logic for when automations should trigger
   - [`Contents`](src/components/Automations/Form/Contents/Contents.tsx) - Main content management component

3. **Content Types**
   - [`TextContent`](src/components/Automations/Form/Contents/TextContent.tsx) - Text-based responses
   - [`MediaContent`](src/components/Automations/Form/Contents/MediaContent.tsx) - Media files (images, videos, audio)
   - [`ProductContent`](src/components/Automations/Form/Contents/ProductContent.tsx) - Product showcases
   - [`ButtonContent`](src/components/Automations/Form/Contents/ButtonContent.tsx) - Interactive button templates
   - [`IGPostContent`](src/components/Automations/Form/Contents/IGPostContent.tsx) - Instagram post references

## Form Structure and Flow

### 1. Form Initialization

The [`AutomationForm`](src/components/Automations/AutomationForm.tsx:54) component initializes with:

```typescript
const form = useForm<AutomationFormType>({
  resolver: zodResolver(AutomationFormSchema),
  mode: "onSubmit",
  reValidateMode: "onChange",
  defaultValues: {
    isNoCondition: false,
    commentStartText: t("comment_start_text"),
    commentStartTitle: t("comment_start_title"),
    conditions: [{ type: "EQUAL", value: "", id: "" }],
    contents: [],
    followCheckMessage: t("follow_check_message"),
    isComment: false,
    isCommentContentTargetEnabled: false,
    isDirect: true,
    isRemindersEnabled: false,
    isReplyCommentEnabled: false,
    justFollowers: false,
    reminders: [],
  },
});
```

### 2. Form Sections

The form is divided into several logical sections:

#### Triggers Section
- Determines whether the automation responds to direct messages or comments
- Located in [`Triggers.tsx`](src/components/Automations/Form/Triggers.tsx:18)
- Uses switches to enable/disable `isDirect` and `isComment` options
- Includes validation to ensure at least one trigger is selected

#### Conditions Section
- Defines the conditions under which the automation triggers
- Located in [`Conditions.tsx`](src/components/Automations/Form/Conditions.tsx:20)
- Supports two condition types: "EQUAL" and "INCLUDE"
- Allows multiple conditions with dynamic add/remove functionality
- Each condition has a `type` and `value` field

#### Contents Section
- The core of the automation where response content is defined
- Located in [`Contents.tsx`](src/components/Automations/Form/Contents/Contents.tsx:46)
- Supports multiple content types with drag-and-drop reordering
- Manages both main content and reminder content

## Content Types in Detail

### 1. Text Content
- **Component**: [`TextContent`](src/components/Automations/Form/Contents/TextContent.tsx:21)
- **Purpose**: Simple text responses with support for variables
- **Features**:
  - 1000 character limit with character counter
  - Support for automation buttons
  - Variable substitution capabilities

### 2. Media Content
- **Component**: [`MediaContent`](src/components/Automations/Form/Contents/MediaContent.tsx:32)
- **Purpose**: Handle file uploads for images, videos, and audio
- **Features**:
  - File upload with progress tracking
  - File type validation
  - Size limitations
  - Error handling for rejected files

### 3. Product Content
- **Component**: [`ProductContent`](src/components/Automations/Form/Contents/ProductContent.tsx:32)
- **Purpose**: Showcase products in automation responses
- **Features**:
  - Product selection from catalog
  - Drag-and-drop reordering
  - Support for up to 10 products
  - Product image display

### 4. Button Content
- **Component**: [`ButtonContent`](src/components/Automations/Form/Contents/ButtonContent.tsx:24)
- **Purpose**: Interactive button templates for user engagement
- **Features**:
  - Multiple button types (Text, URL, Automation trigger)
  - Drag-and-drop button reordering
  - Support for up to 3 buttons in button templates
  - Support for up to 13 quick reply buttons

### 5. Instagram Post Content
- **Component**: [`IGPostContent`](src/components/Automations/Form/Contents/IGPostContent.tsx)
- **Purpose**: Reference Instagram posts in responses
- **Features**:
  - Post selection dialog
  - Media preview
  - Post metadata display

## Form Validation

The form uses Zod for validation with a comprehensive schema defined in [`automationForm.ts`](src/schemas/automationForm.ts:128).

### Key Validation Rules:

1. **Trigger Validation**:
   - At least one trigger (direct or comment) must be selected
   - Cannot have both direct messages and target post comments enabled simultaneously

2. **Content Validation**:
   - At least one content item is required
   - Each content type has specific validation rules:
     - Text content requires a text field
     - Media content requires a file
     - Product content requires at least one selected product
     - Instagram post content requires a valid post reference

3. **Conditional Validation**:
   - If reminders are enabled, reminder time is required
   - If "just followers" is enabled, follow message and check message are required
   - If comment content targeting is enabled, an Instagram post is required

### Validation Implementation:

The validation is implemented using Zod's `superRefine` method for complex conditional logic:

```typescript
.superRefine((data, ctx) => {
  // Trigger validation
  if (!data.isDirect && !data.isComment) {
    const issue = { code: "custom" as const, message: "required" };
    ctx.addIssue({ ...issue, path: ["isDirect"] });
    ctx.addIssue({ ...issue, path: ["isComment"] });
  }
  
  // Content-specific validation
  data.contents.forEach((content, index) => {
    const t = content.type;
    if (t === AutomationContentTypesEnum.TEXT && !content.text) {
      ctx.addIssue({
        path: ["contents", index, "text"],
        code: "custom",
        message: "required",
      });
    }
    // ... more validation rules
  });
});
```

## Sub-forms and Nested Components

### 1. Content Item Management
- **Component**: [`ContentItem`](src/components/Automations/Form/Contents/ContentItem.tsx:68)
- **Purpose**: Wrapper component for individual content items
- **Features**:
  - Drag-and-drop reordering
  - Content type display
  - Delete functionality
  - Consent checkbox for text content

### 2. Button Management
- **Component**: [`AutomationButtons`](src/components/Automations/Form/Contents/AutomationButtons.tsx:43)
- **Purpose**: Manages buttons within content
- **Features**:
  - Dynamic button addition/removal
  - Button type selection
  - Drag-and-drop reordering
  - Different limits for different content types

### 3. Button Item Configuration
- **Component**: [`ButtonContentItem`](src/components/Automations/Form/Contents/ContentButtonsItem.tsx:42)
- **Purpose**: Individual button configuration
- **Features**:
  - Button type selection (Text, URL, Automation, Consent)
  - Conditional fields based on button type
  - Automation selection for automation-trigger buttons

## Context Providers

### 1. Contents Context
- **Component**: [`ContentsContext`](src/components/Automations/Form/Contents/ContentsContext.tsx:7)
- **Purpose**: Provides content management functions to child components
- **Provides**:
  - `updateContents`: Update content at specific index
  - `removeContents`: Remove content at specific index
  - `contents`: Current contents array

### 2. Contents Uploader Context
- **Component**: [`ContentsUploaderContextProvider`](src/components/Automations/Form/Contents/ContentsUploaderContext.tsx)
- **Purpose**: Manages file upload state for media content
- **Features**:
  - File upload progress tracking
  - File validation
  - Upload error handling

## Data Flow

1. **Form Initialization**: Default values are set in [`AutomationForm`](src/components/Automations/AutomationForm.tsx:80)
2. **User Interaction**: Users interact with various form sections
3. **Validation**: Real-time validation using Zod schema
4. **Submission**: Form data is transformed and submitted to API
5. **Response Handling**: Success/error messages are displayed

## API Integration

The form integrates with the backend API through:

1. **Content Cycle CRUD**:
   - `POST /contentCycle` - Create new automation
   - `PATCH /contentCycle/:id` - Update existing automation
   - `DELETE /contentCycle/:id` - Delete automation
   - `GET /contentCycle` - List automations with pagination

2. **File Upload**:
   - `POST /contentCycle/upload` - Upload media files

## State Management

The form uses React Hook Form for state management with:

1. **Form State**: Managed by `useForm` hook
2. **Field Arrays**: Dynamic arrays for conditions, contents, and buttons
3. **Context Providers**: Shared state for content management
4. **SWR**: Data fetching for existing automations

## Internationalization

The module supports multiple languages through `next-intl`:
- Translation keys are organized by component
- Dynamic text content based on user locale
- Error messages are internationalized

## Accessibility

The form includes several accessibility features:
- Proper ARIA labels on form elements
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Error Handling

Comprehensive error handling includes:
1. **Form Validation Errors**: Displayed inline with form fields
2. **API Errors**: Handled with toast notifications
3. **File Upload Errors**: Specific error messages for different failure types
4. **Network Errors**: Graceful fallbacks and retry mechanisms

## Performance Optimizations

1. **Lazy Loading**: Components are loaded as needed
2. **Debounced Validation**: Form validation is debounced to prevent excessive re-renders
3. **Memoization**: Expensive computations are memoized
4. **Virtual Scrolling**: For large lists of items

## Testing Considerations

When testing this module:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **Form Validation**: Test all validation scenarios
4. **API Integration**: Mock API responses for testing
5. **Accessibility**: Test with screen readers and keyboard navigation

## Common Patterns

1. **Dynamic Form Fields**: Using `useFieldArray` for dynamic content
2. **Conditional Rendering**: Showing/hiding fields based on selections
3. **Drag and Drop**: Using `@dnd-kit` for reordering functionality
4. **File Upload**: Custom file upload with progress tracking
5. **Form Composition**: Building complex forms from smaller components

## Best Practices

1. **Component Composition**: Build complex UI from simple, reusable components
2. **Type Safety**: Use TypeScript for all components and interfaces
3. **Error Boundaries**: Implement error boundaries for graceful error handling
4. **Performance**: Optimize re-renders and use appropriate React patterns
5. **Testing**: Write comprehensive tests for all functionality

## Future Enhancements

Potential improvements to consider:
1. **Visual Flow Builder**: Drag-and-drop automation flow visualization
2. **Analytics Dashboard**: Track automation performance
3. **A/B Testing**: Test different automation strategies
4. **AI Integration**: Smart content suggestions
5. **Advanced Scheduling**: Time-based automation triggers

## Conclusion

The ContentCycle module is a sophisticated automation system that provides businesses with powerful tools for Instagram marketing automation. Its modular architecture, comprehensive validation, and flexible content types make it a robust foundation for building engaging automated interactions with Instagram users.

The module demonstrates best practices in React development, form handling, and user experience design, making it an excellent reference for developers working on similar automation systems.