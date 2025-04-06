export const calculateOffset = (data, index) => {
  // Using fixed heights as defined in TaskScreen.js
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += data[i].type === 'section-header' ? 42 : 64;
  }
  return offset;
};

export const preparePriorityData = (sections) => {
  const data = [];
  sections.forEach((section) => {
    // Add section header
    data.push({
      id: `header-${section.title}`,
      title: section.title,
      type: 'section-header',
    });
    // Add tasks with their type
    section.data.forEach((task) => {
      data.push({
        ...task,
        type: 'task-item',
      });
    });
  });
  return data;
};
