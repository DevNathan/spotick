import $ from "jquery";

/**
 * 마이페이지 개인정보 수정 관련 API 통신 모듈
 */
export const userService = (() => {
  const updateDefaultImage = async (image: string): Promise<any> => {
    return $.ajax({
      url: `/mypage/api/updateDefaultImg?imgName=${image}`,
      method: "PATCH",
    });
  };

  const updatePersonalImage = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("uploadFile", file);

    return $.ajax({
      url: `/mypage/api/updatePersonalImg`,
      method: "PATCH",
      data: formData,
      processData: false,
      contentType: false,
    });
  };

  const updateNickname = async (nickname: string): Promise<any> => {
    return $.ajax({
      url: `/mypage/api/updateNickName?nickname=${nickname}`,
      method: "PATCH",
    });
  };

  const startTelVerification = async (tel: string): Promise<boolean> => {
    try {
      await $.ajax({
        url: `/mypage/api/authenticateTelStart?tel=${tel}`,
        method: "GET",
      });
      return true;
    } catch {
      return false;
    }
  };

  const updateTel = async (tel: string, code: string): Promise<any> => {
    return $.ajax({
      url: `/mypage/api/authenticateTel?tel=${tel}&code=${code}`,
      method: "PATCH",
    });
  };

  const updatePassword = async (password: string): Promise<any> => {
    return $.ajax({
      url: `/mypage/api/changePassword?password=${password}`,
      method: "PATCH",
    });
  };

  return {
    updateDefaultImage,
    updatePersonalImage,
    updateNickname,
    startTelVerification,
    updateTel,
    updatePassword,
  };
})();
