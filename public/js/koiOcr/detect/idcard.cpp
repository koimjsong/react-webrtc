#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>
// #include <opencv2/imgproc.hpp>
// #include <opencv2/highgui.hpp>
#include <emscripten.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <unistd.h>
#include <filesystem>
#include <random>
#include <codecvt>
#include <iconv.h>
#include <nlohmann/json.hpp>
#include <functional>
#include <algorithm>
#include <cctype>
#include <chrono>
#include <regex>
#include <chrono>
#include <ctime>
#include <openssl/aes.h>
#include <openssl/rand.h>
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/buffer.h>
#include <openssl/hmac.h>
#include <openssl/err.h>
#include <openssl/ssl.h>
#include <openssl/sha.h>
#include <openssl/ossl_typ.h>
#include <stdexcept>
#include <locale>
#include <codecvt>
#include <sstream>
#include <string_view>
#include <algorithm>
#include <cctype>
#include <set>

using json = nlohmann::json;

cv::dnn::Net Idnet;
cv::dnn::Net Gironet;
cv::Mat format_image;

std::vector<cv::Rect> boxes;
std::vector<float> confidences;
std::vector<int> class_ids;
std::vector<std::string> classes{"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39"};

struct Detection
{
    int class_id{0};
    std::string className{};
    float confidence{0.0};
    cv::Scalar color{};
    cv::Rect box{};
};

cv::Mat formatToSquare(const cv::Mat &source)
{
    int col = source.cols;
    int row = source.rows;
    int _max = MAX(col, row);
    cv::Mat result = cv::Mat::zeros(_max, _max, CV_8UC3);
    source.copyTo(result(cv::Rect(0, 0, col, row)));
    return result;
}

bool processingImage = false;

extern "C"
{
    EMSCRIPTEN_KEEPALIVE
    int loadONNXModel()
    {
        if (!Idnet.empty())
        {
            std::cout << "ONNX model is already loaded." << std::endl;
            return 1;
        }

        bool isTrueURL = true;
        bool isTrueToken = true;

        try
        {
            // std::string modelFilename = "20240515_Certify_pico.onnx";
            std::string modelFilename;
            if (strcmp(modelType, "idcard") == 0)
            {
                modelFilename = "20240515_Certify_pico.onnx";
            }
            else if (strcmp(modelType, "giro") == 0)
            {
                modelFilename = "20240527_giro.onnx";
            }
            else
            {
                std::cerr << "Unknown model type: " << modelType << std::endl;
                return 0;
            }
            std::regex datePattern(R"(\d{8})");
            std::smatch dateMatch;
            if (std::regex_search(modelFilename, dateMatch, datePattern))
            {
                std::string dateString = dateMatch[0];
                std::tm modelDate = {};
                std::istringstream ss(dateString);
                ss >> std::get_time(&modelDate, "%Y%m%d");
                if (!ss.fail())
                {
                    auto currentTime = std::chrono::system_clock::now();
                    auto modelTime = std::chrono::system_clock::from_time_t(std::mktime(&modelDate));

                    bool isTrueDate = true;

                    if (isTrueDate)
                    {
                        if (isTrueToken)
                        {
                            if (isTrueURL)
                            {
                                cv::dnn::Net newNet = cv::dnn::readNetFromONNX("./assets/" + modelFilename);
                                newNet.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
                                newNet.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);

                                if (newNet.empty())
                                {
                                    std::cout << "Failed to load the model." << std::endl;
                                    return 0;
                                }
                                else
                                {
                                    if (!Idnet.empty())
                                    {
                                        Idnet = cv::dnn::Net();
                                    }
                                    Idnet = newNet;
                                    return 1; // 정상 로드
                                }
                            }
                            else
                            {
                                return -2; // 도메인 인증 오류
                            }
                        }
                        else
                        {
                            return -3; // 토큰 인증 오류
                        }
                    }
                    else
                    {
                        std::cout << "Model date is in the future and cannot be loaded." << std::endl;
                        return -1; // 모델 라이선스 인증 오류
                    }
                }
                else
                {
                    std::cerr << "Failed to get current date and time." << std::endl;
                }
            }
            else
            {
                std::cerr << "Date not found in the model filename." << std::endl;
            }
        }
        catch (const cv::Exception &e)
        {
            std::cout << "Error loading the model: " << e.msg << std::endl;
            if (!Idnet.empty())
            {
                Idnet = cv::dnn::Net();
            }
            // return 0;
        }

        // return 0;
    }

    EMSCRIPTEN_KEEPALIVE
    int loadGiroModel()
    {
        if (!Gironet.empty())
        {
            std::cout << "ONNX model is already loaded." << std::endl;
            return 1;
        }

        bool isTrueURL = true;
        bool isTrueToken = true;

        try
        {
            std::string modelFilename = "20240527_giro.onnx";
            std::regex datePattern(R"(\d{8})");
            std::smatch dateMatch;
            if (std::regex_search(modelFilename, dateMatch, datePattern))
            {
                std::string dateString = dateMatch[0];
                std::tm modelDate = {};
                std::istringstream ss(dateString);
                ss >> std::get_time(&modelDate, "%Y%m%d");
                if (!ss.fail())
                {
                    auto currentTime = std::chrono::system_clock::now();
                    auto modelTime = std::chrono::system_clock::from_time_t(std::mktime(&modelDate));

                    bool isTrueDate = true;

                    if (isTrueDate)
                    {
                        if (isTrueToken)
                        {
                            if (isTrueURL)
                            {
                                cv::dnn::Net newNet = cv::dnn::readNetFromONNX("./assets/" + modelFilename);
                                newNet.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
                                newNet.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);

                                if (newNet.empty())
                                {
                                    std::cout << "Failed to load the model." << std::endl;
                                    return 0;
                                }
                                else
                                {
                                    if (!Gironet.empty())
                                    {
                                        Gironet = cv::dnn::Net();
                                    }
                                    Gironet = newNet;
                                    return 1; // 정상 로드
                                }
                            }
                            else
                            {
                                return -2; // 도메인 인증 오류
                            }
                        }
                        else
                        {
                            return -3; // 토큰 인증 오류
                        }
                    }
                    else
                    {
                        std::cout << "Model date is in the future and cannot be loaded." << std::endl;
                        return -1; // 모델 라이선스 인증 오류
                    }
                }
                else
                {
                    std::cerr << "Failed to get current date and time." << std::endl;
                }
            }
            else
            {
                std::cerr << "Date not found in the model filename." << std::endl;
            }
        }
        catch (const cv::Exception &e)
        {
            std::cout << "Error loading the model: " << e.msg << std::endl;
            if (!Gironet.empty())
            {
                Gironet = cv::dnn::Net();
            }
            // return 0;
        }

        // return 0;
    }

    EMSCRIPTEN_KEEPALIVE
    int detectObjects(unsigned char *srcData, int width, int height)
    {
        //	std::cout<<"detectObjects In"<<std::endl;

        if (processingImage)
        {
            // 이미지 처리가 이미 진행 중인 경우 에러 메시지 반환
            //  return boxes;
        }

        try
        {
            if (Idnet.empty())
            {
                json errorJson;
                errorJson["error_code"] = 9998;
                std::string errorStr = errorJson.dump();

                char *errorCStr = static_cast<char *>(malloc(errorStr.length() + 1));
                strcpy(errorCStr, errorStr.c_str());

                // return boxes;
            }

            processingImage = true;
            cv::Mat srcImage(height, width, CV_8UC4, srcData);
            cv::cvtColor(srcImage, srcImage, cv::COLOR_RGBA2BGR);
            cv::Mat format_image = formatToSquare(srcImage);
            cv::resize(format_image, format_image, cv::Size(640, 640));

            cv::Mat inputBlob;
            cv::dnn::blobFromImage(format_image, inputBlob, 1.0 / 255.0, cv::Size(640, 640), cv::Scalar(), true, false);

            Idnet.setInput(inputBlob);

            std::vector<cv::Mat> outputs;
            Idnet.forward(outputs, Idnet.getUnconnectedOutLayersNames());

            int rows = outputs[0].size[1];
            int dimensions = outputs[0].size[2];
            const float conf_threshold = 0.5f;
            const float score_threshold = 0.4f;
            const float iou_threshold = 0.25f;

            bool yolov8 = false;
            if (dimensions > rows)
            {
                yolov8 = true;
                rows = outputs[0].size[2];
                dimensions = outputs[0].size[1];
                outputs[0] = outputs[0].reshape(1, dimensions);
                cv::transpose(outputs[0], outputs[0]);
            }

            std::vector<json> boxesJSON;

            float *data = (float *)outputs[0].data;
            float x_factor = 1.0f;
            float y_factor = 1.0f;

            for (int i = 0; i < rows; ++i)
            {
                float confidence = data[4];

                if (confidence >= conf_threshold)
                {
                    float *classes_scores = data + 5;
                    cv::Mat scores(1, classes.size(), CV_32FC1, classes_scores);
                    cv::Point class_id;
                    double max_class_score;
                    cv::minMaxLoc(scores, 0, &max_class_score, 0, &class_id);

                    if (max_class_score > score_threshold)
                    {
                        confidences.push_back(confidence);
                        class_ids.push_back(class_id.x);

                        float x = data[0];
                        float y = data[1];
                        float w = data[2];
                        float h = data[3];

                        int left = static_cast<int>((x - 0.5 * w) * x_factor);
                        int top = static_cast<int>((y - 0.5 * h) * y_factor);
                        int width = static_cast<int>(w * x_factor);
                        int height = static_cast<int>(h * y_factor);

                        left = std::max(0, left);
                        top = std::max(0, top);
                        width = std::min(width, format_image.cols - left);
                        height = std::min(height, format_image.rows - top);

                        boxes.push_back(cv::Rect(left, top, width, height));

                        json boxJSON;
                        boxJSON["left"] = left;
                        boxJSON["top"] = top;
                        boxJSON["width"] = width;
                        boxJSON["height"] = height;

                        boxesJSON.push_back(boxJSON);
                    }
                }
                data += dimensions;
            }

            processingImage = false;

            std::vector<int> nms_result;
            cv::dnn::NMSBoxes(boxes, confidences, score_threshold, iou_threshold, nms_result);
            std::vector<Detection> results;

            for (int i : nms_result)
            {
                Detection result;
                result.class_id = class_ids[i];
                result.confidence = confidences[i];
                result.className = classes[result.class_id];
                result.box = boxes[i];

                // Crop 할게 아니라 주석 처리(24.05.20)
                // if (result.box.x < 0){
                // result.box.x = 0;
                //}
                // if (result.box.y < 0){
                // result.box.y = 0;
                //}
                // if (result.box.x + result.box.width >= format_image.cols){
                //    result.box.width = format_image.cols - result.box.x - 1;
                //}
                // if (result.box.y + result.box.height >= format_image.rows){
                //    result.box.height = format_image.rows - result.box.y - 1;
                //}

                results.push_back(result);
            }

            // 신분증에 대한 영역 체크.
            int id_check = 0; // -> 6가 되야함.
            int dl_check = 0; // -> 7 또는 8이 되야함.
            int pp_check = 0; // -> 8이 되야함
            int rc_check = 0; // -> 4 이상
            int vm_check = 0; // -> 6 또는 7이 되야함.

            int type_code = 0;     // 어떤 신분증인지 확인하고 아래에서 분기처리
            float size_ratio = 0;  // 근거리, 원거리 확인용
            float photo_ratio = 0; // 사진 영역이 너무 작을 때 버리기 위함
            float type_ratio = 0;  // 신분증 영역의 가로 세로 비율. 너무 기울어져있거나 일부가 잘리면 버리도록 설정

            int photo_w = 0; // 면허증 사진영역이 2개라 값 설정
            int photo_h = 0; // 면허증 사진영역이 2개라 값 설정

            if (!results.empty())
            {
                confidences.clear();
                class_ids.clear();
                boxes.clear();
                for (size_t i = 0; i < results.size(); ++i)
                {
                    const Detection &result = results[i];
                    int class_id = result.class_id;
                    //	    std::cout << "class_id: " << class_id << std::endl;
                    // 주민등록증 체크
                    if (class_id == 0 || class_id == 1 || class_id == 3 || class_id == 4 || class_id == 8 || class_id == 22)
                    {
                        id_check += 1;
                    }
                    if (class_id == 0 || class_id == 1 || class_id == 3 || class_id == 5 || class_id == 7 || class_id == 8 || class_id == 22)
                    {
                        if (class_id == 8)
                        {
                            dl_check += 10;
                        }
                        else
                        {
                            dl_check += 1;
                        }
                    }

                    if (class_id == 8 || class_id == 10 || class_id == 13 || class_id == 14 || class_id == 20 || class_id == 21 || class_id == 22)
                    {
                        pp_check += 1;
                    }

                    if (class_id == 8 || class_id == 22 || class_id == 23 || class_id == 24 || class_id == 27)
                    {
                        rc_check += 1;
                    }

                    if (class_id == 8 || class_id == 22 || class_id == 31 || class_id == 32 || class_id == 33 || class_id == 34 || class_id == 36)
                    {
                        vm_check += 1;
                    }

                    if (class_id == 17 || class_id == 18 || class_id == 19 || class_id == 28 || class_id == 38)
                    {
                        size_ratio = ((float)(format_image.cols * format_image.rows)) / (result.box.width * result.box.height);
                        type_code = class_id;
                        type_ratio = ((float)result.box.width) / result.box.height;
                        //	std::cout << "size_ratio: " << size_ratio <<  std::endl;
                        //	std::cout << "type_ratio: " << type_ratio <<  std::endl;
                    }

                    if (class_id == 8)
                    {
                        if (result.box.width > photo_w)
                        {
                            photo_w = result.box.width;
                        }
                        if (result.box.height > photo_h)
                        {
                            photo_h = result.box.height;
                        }
                        photo_ratio = ((float)photo_w) / photo_h;
                    }
                }

                // 조건에 대한 return 값 결정
                if (size_ratio > 4.0)
                {
                    std::cout << "원거리 촬영, size_ratio : " << size_ratio << std::endl;
                    return 1;
                }
                else if (type_ratio <= 1.1)
                {
                    std::cout << "신분증 비율이 맞지 않음, type_ratio : " << type_ratio << std::endl;
                    return 1;
                }
                else if (photo_w * photo_h == 0)
                {
                    std::cout << "사진영역이 보이지 않음 " << std::endl;
                    return 1;
                }
                else if (photo_ratio <= 0.7)
                {
                    std::cout << "사진영역이 부분적임, photo_ratio : " << photo_ratio << std::endl;
                    return 1;
                }
                else
                {
                    if (type_code == 17)
                    {
                        if (id_check >= 6)
                        {
                            return 2;
                        }
                        else
                        {
                            std::cout << "주민등록증 일부 영역이 탐지되지 않음, check : " << id_check << std::endl;
                            return 1;
                        }
                    }
                    else if (type_code == 18)
                    {
                        if (dl_check >= 26)
                        {
                            return 2;
                        }
                        else
                        {
                            std::cout << "운전면허증 일부 영역이 탐지되지 않음, check : " << dl_check << std::endl;
                            return 1;
                        }
                    }
                    else if (type_code == 19)
                    {
                        if (pp_check >= 8)
                        {
                            return 2;
                        }
                        else
                        {
                            std::cout << "여권 일부 영역이 탐지되지 않음, check : " << pp_check << std::endl;
                            return 1;
                        }
                    }
                    else if (type_code == 28)
                    {
                        if (rc_check >= 5)
                        {
                            return 2;
                        }
                        else
                        {
                            std::cout << "외국인등록증 일부 영역이 탐지되지 않음, check : " << rc_check << std::endl;
                            return 1;
                        }
                    }
                    else if (type_code == 38)
                    {
                        if (vm_check >= 7 || vm_check >= 8)
                        {
                            return 2;
                        }
                        else
                        {
                            std::cout << "보훈증 일부 영역이 탐지되지 않음, check : " << vm_check << std::endl;
                            return 1;
                        }
                    }
                    else
                    {
                        std::cout << "어떤 Case 인지 확인이 어렵다. " << std::endl;
                        std::cout << "size_ratio : " << size_ratio << std::endl;
                        std::cout << "type_ratio : " << type_ratio << std::endl;
                        std::cout << "photo_ratio : " << photo_ratio << std::endl;
                        std::cout << "type_code : " << type_code << std::endl;
                        std::cout << "id_check : " << id_check << std::endl;
                        std::cout << "dl_check : " << dl_check << std::endl;
                        std::cout << "pp_check : " << pp_check << std::endl;
                        std::cout << "rc_check : " << rc_check << std::endl;
                        std::cout << "vm_check : " << vm_check << std::endl;

                        return 1;
                    }
                }
            }
            else
            { // 탐지된 게 없으면 0 리턴
                return 0;
            }
        }
        catch (const cv::Exception &e)
        {
            processingImage = false;
            std::cerr << "OpenCV Error: " << e.what() << std::endl;
            return 0;
        }
    }

    int detectGiro(unsigned char *srcData, int width, int height)
    {
        //	std::cout<<"detectObjects In"<<std::endl;

        if (processingImage)
        {
            // 이미지 처리가 이미 진행 중인 경우 에러 메시지 반환
            //  return boxes;
        }

        try
        {
            if (Idnet.empty())
            {
                json errorJson;
                errorJson["error_code"] = 9998;
                std::string errorStr = errorJson.dump();

                char *errorCStr = static_cast<char *>(malloc(errorStr.length() + 1));
                strcpy(errorCStr, errorStr.c_str());

                // return boxes;
            }

            processingImage = true;
            cv::Mat srcImage(height, width, CV_8UC4, srcData);
            cv::cvtColor(srcImage, srcImage, cv::COLOR_RGBA2BGR);
            cv::Mat format_image = formatToSquare(srcImage);
            cv::resize(format_image, format_image, cv::Size(640, 640));

            cv::Mat inputBlob;
            cv::dnn::blobFromImage(format_image, inputBlob, 1.0 / 255.0, cv::Size(640, 640), cv::Scalar(), true, false);

            Idnet.setInput(inputBlob);

            std::vector<cv::Mat> outputs;
            Idnet.forward(outputs, Idnet.getUnconnectedOutLayersNames());

            int rows = outputs[0].size[1];
            int dimensions = outputs[0].size[2];
            const float conf_threshold = 0.5f;
            const float score_threshold = 0.4f;
            const float iou_threshold = 0.25f;

            bool yolov8 = false;
            if (dimensions > rows)
            {
                yolov8 = true;
                rows = outputs[0].size[2];
                dimensions = outputs[0].size[1];
                outputs[0] = outputs[0].reshape(1, dimensions);
                cv::transpose(outputs[0], outputs[0]);
            }

            std::vector<json> boxesJSON;

            float *data = (float *)outputs[0].data;
            float x_factor = 1.0f;
            float y_factor = 1.0f;

            for (int i = 0; i < rows; ++i)
            {
                float confidence = data[4];

                if (confidence >= conf_threshold)
                {
                    float *classes_scores = data + 5;
                    cv::Mat scores(1, classes.size(), CV_32FC1, classes_scores);
                    cv::Point class_id;
                    double max_class_score;
                    cv::minMaxLoc(scores, 0, &max_class_score, 0, &class_id);

                    if (max_class_score > score_threshold)
                    {
                        confidences.push_back(confidence);
                        class_ids.push_back(class_id.x);

                        float x = data[0];
                        float y = data[1];
                        float w = data[2];
                        float h = data[3];

                        int left = static_cast<int>((x - 0.5 * w) * x_factor);
                        int top = static_cast<int>((y - 0.5 * h) * y_factor);
                        int width = static_cast<int>(w * x_factor);
                        int height = static_cast<int>(h * y_factor);

                        left = std::max(0, left);
                        top = std::max(0, top);
                        width = std::min(width, format_image.cols - left);
                        height = std::min(height, format_image.rows - top);

                        boxes.push_back(cv::Rect(left, top, width, height));

                        json boxJSON;
                        boxJSON["left"] = left;
                        boxJSON["top"] = top;
                        boxJSON["width"] = width;
                        boxJSON["height"] = height;

                        boxesJSON.push_back(boxJSON);
                    }
                }
                data += dimensions;
            }

            processingImage = false;

            std::vector<int> nms_result;
            cv::dnn::NMSBoxes(boxes, confidences, score_threshold, iou_threshold, nms_result);
            std::vector<Detection> results;

            for (int i : nms_result)
            {
                Detection result;
                result.class_id = class_ids[i];
                result.confidence = confidences[i];
                result.className = classes[result.class_id];
                result.box = boxes[i];

                // Crop 할게 아니라 주석 처리(24.05.20)
                // if (result.box.x < 0){
                // result.box.x = 0;
                //}
                // if (result.box.y < 0){
                // result.box.y = 0;
                //}
                // if (result.box.x + result.box.width >= format_image.cols){
                //    result.box.width = format_image.cols - result.box.x - 1;
                //}
                // if (result.box.y + result.box.height >= format_image.rows){
                //    result.box.height = format_image.rows - result.box.y - 1;
                //}
                std::cout << "Result: class_id = " << result.class_id << ", confidence = " << result.confidence << ", className = " << result.className << ", box = " << result.box << std::endl;

                results.push_back(result);
            }


        }
        catch (const cv::Exception &e)
        {
            processingImage = false;
            std::cerr << "OpenCV Error: " << e.what() << std::endl;
            return 0;
        }
    }
}
