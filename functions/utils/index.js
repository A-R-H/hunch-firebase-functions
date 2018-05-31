exports.refineUserInfo = data => {
  return {
    tickets: data.value.internalValue,
    email: data.left.value.internalValue,
    creation_time: data.left.left.value.internalValue,
    username: data.right.value.internalValue
  };
};
