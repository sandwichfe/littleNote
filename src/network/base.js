import { request,LoginRequest } from "./request";

export function getFileList(filePath, queryWord) {
    return request({
        method: "post",
        url: "/file/list1",
      params: {         
        path:filePath,
        keyword:queryWord,
      }
    })}

    export function listNote(pageNum, pageSize) {
      return request({
          method: "post",
          url: "/note/listNote",
        params: {         
          pageNum:pageNum,
          pageSize:pageSize,
        }
      })}

      export function getNote(id) {
        return request({
            method: "post",
            url: "/note/getNote",
          params: {         
            id:id,
          }
        })}

        export function editNote(id,content,title) {
          return request({
              method: "post",
              url: "/note/editNote",
            params: {         
              id:id,
              content:content,
              title:title
            }
          })}


          export function addNote(id,content,title) {
            return request({
                method: "post",
                url: "/note/addNote",
              params: {         
                id:id,
                content:content,
                title:title
              }
            })}


            export function deleteNoteItem(id) {
              return request({
                  method: "post",
                  url: "/note/deleteNote",
                params: {         
                  id:id,
                }
              })}


              
            export  function login(username,password) {
              return LoginRequest({
                url: '/user/login',
                method:'post',
                params: {     
                  username,
                  password
                }
              })
            }